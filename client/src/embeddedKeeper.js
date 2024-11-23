import * as THREE from 'three';
import { SceneManager } from './three/SceneManager';
import { CameraController } from './three/CameraController';

let renderer, cameraController;
let sceneManager;
let initialized = false;

export function initializeImageKeeper() {
    if (initialized) return;
    initialized = true;

    // Setup scene
    sceneManager = new SceneManager();
    
    // Setup renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Setup camera controller
    cameraController = new CameraController(renderer);
    cameraController.camera.lookAt(sceneManager.getCube().position);

    window.addEventListener('resize', onWindowResize);
    animate();
}

export function addImage(imageObject) {
    if (sceneManager) {
        sceneManager.addImagePlane(imageObject);
    }
}

function onWindowResize() {
    cameraController.handleResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    cameraController.update();
    renderer.render(sceneManager.getScene(), cameraController.camera);
}
