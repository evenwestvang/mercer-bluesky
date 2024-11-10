import { WebSocketServer, WebSocket } from 'ws';
import { config } from '../constants.js';

const createWebSocketServer = () => {
    const messageHistory = [];
    let lastBroadcastTime = Date.now();
    
    const wss = new WebSocketServer({ port: config.WS_PORT });
    
    const handleMessage = (messageData) => {
        // Add to history, maintaining max size
        messageHistory.push(messageData);
        if (messageHistory.length > config.MAX_HISTORY) {
            messageHistory.shift();
        }

        broadcastMessage(messageData);

        // Broadcast with rate limiting
        // const now = Date.now();
        // if (now - lastBroadcastTime >= config.BROADCAST_INTERVAL) {
        //     broadcastMessage(messageData);
        //     lastBroadcastTime = now;
        // }
    };

    const broadcastMessage = (messageData) => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(messageData));
            }
        });
    };

    wss.on('connection', (ws) => {
        console.log('Client connected');
        messageHistory.forEach(msg => {
            ws.send(JSON.stringify(msg));
        });
    });

    return { wss, handleMessage };
};

export default createWebSocketServer; 