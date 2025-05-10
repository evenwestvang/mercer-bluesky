import createWebSocketServer from './websocket/websocketServer.js';
import createJetstreamService from './services/jetstream.js';
import { processJetstreamMessage } from './processJetstreamMessage.js';

const initializeServer = () => {
    // Setup WebSocket server
    const wsServer = createWebSocketServer();

    // Setup Jetstream service
    const jetstreamService = createJetstreamService(processJetstreamMessage(wsServer));
    jetstreamService.setupJetstream();
};

initializeServer();
