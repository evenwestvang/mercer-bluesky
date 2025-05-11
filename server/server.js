process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error);
    // It's generally recommended to exit the process after an uncaught exception
    // For long-running services, systemd or another process manager should restart it.
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
    // Optionally, you might also want to exit here, or log more details about the promise
    // process.exit(1); 
});

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
