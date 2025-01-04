const { spawn, spawnSync } = require('child_process');
const path = require('path');

const RESTART_INTERVAL = process.env.RESTART_INTERVAL || 1800000; // 30 minutes in ms
let serverProcess = null;

function buildClient() {
    console.log(`[${new Date().toISOString()}] Building client...`);
    const clientDir = path.join(__dirname, '..', 'client');
    const result = spawnSync('npm', ['run', 'build'], {
        stdio: 'inherit',
        cwd: clientDir
    });
    
    if (result.status !== 0) {
        console.error('Client build failed');
        process.exit(1);
    }
}

function startServer() {
    console.log(`[${new Date().toISOString()}] Starting server...`);
    
    // Build client first
    buildClient();
    
    // Start server
    serverProcess = spawn('npm', ['run', 'start'], {
        stdio: 'inherit',
        cwd: __dirname
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

// Start initial server
startServer();

// Setup periodic restart
setInterval(() => {
    console.log(`[${new Date().toISOString()}] Scheduled restart`);
    if (serverProcess) {
        serverProcess.kill('SIGTERM');
    }
}, RESTART_INTERVAL);
