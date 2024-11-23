import * as THREE from 'three';
import { SceneManager } from './three/SceneManager';
import { CameraController } from './three/CameraController';

// Scene rendering state
let renderer, cameraController, sceneManager;
let initialized = false;

// Initialize 3D viewer
function initializeViewer() {
    if (initialized) return;
    initialized = true;

    sceneManager = new SceneManager();
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    cameraController = new CameraController(renderer);
    cameraController.camera.lookAt(sceneManager.getCube().position);

    window.addEventListener('resize', () => {
        cameraController.handleResize();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    cameraController.update();
    renderer.render(sceneManager.getScene(), cameraController.camera);
}

// WebSocket connection handling
const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.hostname === 'localhost' ? ':3001' : '';
    const path = window.location.hostname === 'localhost' ? '' : '/ws';
    return `${protocol}//${host}${port}${path}`;
};

function connectWebSocket({ allowNSFW = false } = {}) {
    const ws = new WebSocket(getWebSocketUrl());
    initializeViewer();

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        message.embed?.images?.forEach(image => {
            if (sceneManager) {
                sceneManager.addImagePlane(image);
            }
        });
    };

    ws.onclose = () => {
        console.log('WebSocket closed. Reconnecting...');
        setTimeout(() => connectWebSocket({ allowNSFW }), 1000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
    };

    ws.onopen = () => console.log('WebSocket connected');
}

// Start the application
connectWebSocket({ allowNSFW: true });
