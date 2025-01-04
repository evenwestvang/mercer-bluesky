import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';
import winston from 'winston';
import 'winston-daily-rotate-file';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup logging
const logger = winston.createLogger({
    transports: [
        new winston.transports.DailyRotateFile({
            filename: 'logs/server-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d'
        })
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
    console.log(`[${new Date().toISOString()}] Starting server...`);
    
    serverProcess = spawn('npm', ['run', 'start'], {
        stdio: 'inherit',
        cwd: __dirname,
        env: {
            ...process.env,
            NODE_OPTIONS: '--max-old-space-size=512' // Limit Node.js memory usage
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
