
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class CameraController {
    constructor(renderer) {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.setupCamera();
        this.setupControls(renderer);
    }

    setupCamera() {
        this.camera.position.set(10, 6, 10);
        this.camera.lookAt(0, 1.5, 0);
    }

    setupControls(renderer) {
        this.controls = new OrbitControls(this.camera, renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.enableZoom = true;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 20;
        this.controls.enablePan = false;
        this.controls.target.set(0, 1.5, 0);
        this.controls.update();

        renderer.domElement.style.cursor = 'grab';
    }

    update() {
        this.controls.update();
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}