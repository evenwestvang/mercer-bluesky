

import { renderImage } from './imageKeeper.js';

const ws = new WebSocket('ws://localhost:3001');
const feedDiv = document.getElementById('feed');

function connectWebSocket() {
    const ws = new WebSocket('ws://localhost:3001');
    const feedDiv = document.getElementById('feed');

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);
        // renderImage(thumb);
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
