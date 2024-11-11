import { addImage, initializeImageKeeper } from './imageKeeper.js';

const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;    
    return `${protocol}//${host}`;
};

export function connectWebSocket({ allowNSFW = false } = {}) {
    const ws = new WebSocket(getWebSocketUrl());
    console.log('**** WebSocket URL:', getWebSocketUrl());
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

const initializeWithModal = () => {
    const modal = document.getElementById('modal');
    const warning1 = document.querySelector('.warning-1');
    const warning2 = document.querySelector('.warning-2');
    
    // First warning button
    document.querySelector('.warning-1 button').addEventListener('click', () => {
        warning1.style.display = 'none';
        warning2.style.display = 'block';
    });

    // SFW button
    document.querySelector('.warning-2 button.sfw').addEventListener('click', () => {
        modal.style.display = 'none';
        connectWebSocket({ allowNSFW: false });
    });

    // NSFW button
    document.querySelector('.warning-2 button.nsfw').addEventListener('click', () => {
        modal.style.display = 'none';
        connectWebSocket({ allowNSFW: true });
    });
};

// Replace the previous connectWebSocket() call with:
document.addEventListener('DOMContentLoaded', initializeWithModal);
