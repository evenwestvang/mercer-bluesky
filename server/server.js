import express from 'express';
import cors from 'cors';
import { config } from './constants.js';
import createWebSocketServer from './websocket/websocketServer.js';
import createFirehoseService from './services/firehose.js';
import { processFirehoseMessage } from './processFirehoseMessage.js';

const initializeServer = () => {
    const app = express();
    app.use(cors());

    // Setup HTTP server
    app.listen(config.HTTP_PORT, () => {
        console.log(`HTTP Server running on port ${config.HTTP_PORT}`);
    });

    // Setup WebSocket server
    const wsServer = createWebSocketServer();

    // Setup Firehose service
    const firehoseService = createFirehoseService(processFirehoseMessage(wsServer));
    firehoseService.setupFirehose();
};

initializeServer();