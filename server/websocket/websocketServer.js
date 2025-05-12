import { WebSocketServer, WebSocket } from 'ws';
import { config } from '../constants.js';

const createWebSocketServer = () => {
    const messageHistory = [];
    let lastBroadcastTime = Date.now();
    
    console.log(`Starting WebSocket server on port ${config.WS_PORT}...`);
    const wss = new WebSocketServer({ 
        port: config.WS_PORT,
        // Add ping interval to keep connections alive
        perMessageDeflate: false,
        clientTracking: true
    });
    
    // Set up ping interval
    const pingInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                console.log('Client connection timed out, terminating');
                return ws.terminate();
            }
            
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000); // Send ping every 30 seconds

    wss.on('error', (error) => {
        console.error('WebSocket Server Error:', error);
        // Depending on the error, you might want to attempt a graceful shutdown
        // or re-initialization, but for now, logging is the priority.
        // If the error is critical (e.g., EADDRINUSE during initial startup though that should be caught earlier),
        // the process might need to exit so systemd can restart it.
        // For runtime errors, this log will be key.
    });
    
    const handleMessage = (messageData) => {
        // Add to history, maintaining max size
        messageHistory.push(messageData);
        if (messageHistory.length > config.MAX_HISTORY) {
            messageHistory.shift();
        }

        broadcastMessage(messageData);
    };

    const broadcastMessage = (messageData) => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(messageData));
            }
        });
    };

    wss.on('connection', (ws) => {
        console.log(`Client connected. Total clients: ${wss.clients.size}`);
        
        // Set up connection tracking
        ws.isAlive = true;
        
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('close', () => {
            console.log(`Client disconnected. Remaining clients: ${wss.clients.size}`);
        });

        // Send history to new client
        messageHistory.forEach(msg => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(msg));
            }
        });
    });

    // Clean up on server close
    wss.on('close', () => {
        clearInterval(pingInterval);
    });

    return { wss, handleMessage };
};

export default createWebSocketServer;
