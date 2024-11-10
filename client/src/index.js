

import { renderImage } from './imageKeeper.js';

const ws = new WebSocket('ws://localhost:3001');
const feedDiv = document.getElementById('feed');

function connectWebSocket() {
    const ws = new WebSocket('ws://localhost:3001');
    const feedDiv = document.getElementById('feed');

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const images = message.embed.images
        console.log(`Images added: ${images.length}`);
        images.forEach(image => {
            renderImage(image);
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

// Initial connection
connectWebSocket();
// Clear console
console.clear();
