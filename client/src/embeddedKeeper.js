import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SceneManager } from './three/SceneManager';

let camera, renderer, controls;
let sceneManager;
let initialized = false;

export function initializeImageKeeper() {
    if (initialized) return;
    initialized = true;

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

    // Setup camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 6, 10);
    camera.lookAt(sceneManager.getCube().position);

    // Setup controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.enablePan = false;
    controls.target.set(0, 1.5, 0);
    controls.update();

    renderer.domElement.style.cursor = 'grab';
    window.addEventListener('resize', onWindowResize);
    
    animate();
}

export function addImage(imageObject) {
    if (sceneManager) {
        sceneManager.addImagePlane(imageObject);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(sceneManager.getScene(), camera);
}
