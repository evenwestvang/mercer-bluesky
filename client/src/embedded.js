import { addImage, initializeImageKeeper } from './embeddedKeeper.js';

const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.hostname === 'localhost' ? ':3001' : '';
    const path = window.location.hostname === 'localhost' ? '' : '/ws';
    return `${protocol}//${host}${port}${path}`;
};

export function connectWebSocket({ allowNSFW = false } = {}) {
    const url = getWebSocketUrl()
    const ws = new WebSocket(url);
    initializeImageKeeper({ allowNSFW })

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const images = message.embed.images
        images.forEach(image => {
            addImage(image, allowNSFW);
        });
    };

    ws.onclose = () => {
        console.log('WebSocket closed. Reconnecting...');
        // Try to reconnect after 1 second
        setTimeout(connectWebSocket, 1000);
        console.log('Attempting to reconnect...');
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
    };
    ws.onopen = () => {
        console.log('WebSocket connected');
    };
}

connectWebSocket({ allowNSFW: true });
