import cors from 'cors';
import { config } from './constants.js';
import createWebSocketServer from './websocket/websocketServer.js';
import createFirehoseService from './services/firehose.js';
import { processFirehoseMessage } from './processFirehoseMessage.js';

const initializeServer = () => {
    // Setup WebSocket server
    const wsServer = createWebSocketServer();

    // Setup Firehose service
    const firehoseService = createFirehoseService(processFirehoseMessage(wsServer));
    firehoseService.setupFirehose();
};

initializeServer();