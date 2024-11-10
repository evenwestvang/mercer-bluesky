import express from 'express';
import { WebSocketServer, WebSocket } from 'ws'; 
import { Firehose } from "@skyware/firehose";
import cors from 'cors';

const app = express();
app.use(cors());

// Regular HTTP server for health checks etc
const port = 3000;
app.listen(port, () => {
  console.log(`HTTP Server running on port ${port}`);
});

// WebSocket server to stream data to frontend
const wss = new WebSocketServer({ port: 3001 });

// Keep track of last 100 messages
const messageHistory = [];
const MAX_HISTORY = 10;

// Broadcast rate limiting
const BROADCAST_INTERVAL = 500; // milliseconds
let lastBroadcastTime = Date.now();

// Firehose connection
const firehose = new Firehose({relay: 'wss://bsky.network'});
firehose.start()
firehose.on("connect", () => {
  console.log("Connected to Firehose");
  // Add explicit subscription
  firehose.subscribe({
    filter: {
      types: ['app.bsky.feed.post']
    }
  });
});

// Single firehose subscription
firehose.on("commit", (message) => {
    for (const op of message.ops) {
        const uri = "at://" + message.repo + "/" + op.path;
        
        const messageData = { uri, op, repo: message.repo };

        // Extract images if present in the record
        if (op.action === 'create' && op.record?.embed?.images?.length > 0) {
            messageData.embed = op.record.embed;
        }

        // Skip messages without images
        if (!messageData.embed) {
            continue;
        }
        
        // Add to history, maintaining max size
        messageHistory.push(messageData);
        if (messageHistory.length > MAX_HISTORY) {
            messageHistory.shift();
        }

        // Only broadcast if enough time has passed since last broadcast
        const now = Date.now();
        if (now - lastBroadcastTime >= BROADCAST_INTERVAL) {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(messageData));
                }
            });
            lastBroadcastTime = now;
        }
    }
});

// Add more detailed error logging
firehose.on("error", (error) => {
    console.error("Firehose error:", error);
    console.error("Error stack:", error.stack);
});
  
firehose.on("open", () => {
    console.log("Connected to Firehose.");
    // Firehose will automatically attempt to reconnect
});
    
firehose.on("close", () => {
    console.log("Disconnected from Firehose. Attempting to reconnect...");
    // Firehose will automatically attempt to reconnect
});

wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // Send message history to newly connected client
    messageHistory.forEach(msg => {
        ws.send(JSON.stringify(msg));
    });
});