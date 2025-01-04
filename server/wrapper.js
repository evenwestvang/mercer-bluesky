import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';
import winston from 'winston';
import 'winston-daily-rotate-file';

// Get absolute paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);
const SERVER_DIR = join(PROJECT_ROOT, 'server');

// Setup logging with absolute paths
const logger = winston.createLogger({
    transports: [
        new winston.transports.DailyRotateFile({
            filename: join(PROJECT_ROOT, 'logs/server-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d'
        }),
        new winston.transports.Console() // Add console logging for debugging
    ]
});

const RESTART_INTERVAL = process.env.RESTART_INTERVAL || 1800000; // 30 minutes in ms
const MEMORY_THRESHOLD = process.env.MEMORY_THRESHOLD || 1024 * 1024 * 1024; // 1GB
const LOAD_THRESHOLD = process.env.LOAD_THRESHOLD || 0.8; // 80% CPU load average
let serverProcess = null;
let lastRestartTime = Date.now();

function checkSystemHealth() {
    const loadAvg = os.loadavg()[0] / os.cpus().length;

    logger.info('Health check:', {
        load: (loadAvg * 100).toFixed(1) + '%'
    });

    if (loadAvg > LOAD_THRESHOLD) {
        logger.warn(`High CPU load detected: ${(loadAvg * 100).toFixed(1)}%`);
        return false;
    }

    return true;
}

function restartIfUnhealthy() {
    // Don't restart if we just did within last 5 minutes
    if (Date.now() - lastRestartTime < 300000) return;

    if (!checkSystemHealth()) {
        console.log(`[${new Date().toISOString()}] Unhealthy system detected, initiating restart`);
        if (serverProcess) {
            serverProcess.kill('SIGTERM');
            lastRestartTime = Date.now();
        }
    }
}

function startServer() {
    logger.info('Starting server...', { cwd: SERVER_DIR });
    
    // Run server.js directly with node instead of using npm
    serverProcess = spawn('/usr/local/bin/node', ['server.js'], {
        stdio: 'inherit',
        cwd: SERVER_DIR,
        env: {
            ...process.env,
            NODE_ENV: 'production',
            NODE_OPTIONS: '--max-old-space-size=512'
        }
    });

    serverProcess.on('exit', (code, signal) => {
        console.log(`[${new Date().toISOString()}] Server exited with code ${code} and signal ${signal}`);
        if (signal !== 'SIGTERM') {
            // Unexpected exit, restart immediately
            startServer();
        }
    });
}

function gracefulShutdown() {
    console.log('Received shutdown signal, stopping server...');
    if (serverProcess) {
        serverProcess.kill('SIGTERM');
        // Give it 30 seconds to shutdown gracefully
        setTimeout(() => {
            if (serverProcess) {
                console.log('Force killing server...');
                serverProcess.kill('SIGKILL');
            }
        }, 30000);
    }
    process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Use top-level await for startup
startServer();

// Setup health check interval
setInterval(restartIfUnhealthy, 60000); // Check every minute

// Setup periodic restart
setInterval(() => {
    console.log(`[${new Date().toISOString()}] Scheduled restart`);
    if (serverProcess) {
        serverProcess.kill('SIGTERM');
    }
}, RESTART_INTERVAL);
