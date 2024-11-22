import * as THREE from 'three';
import { ImageProcessor } from './ImageProcessor';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.imageProcessor = new ImageProcessor();
        this.setupLights();
        this.createObjects();
        this.imagePlanes = new Set(); // Track active image planes
        this.textureLoader = new THREE.TextureLoader();
        this.textureLoader.crossOrigin = 'anonymous';
        this.textureCanvas = document.createElement('canvas');
        this.textureContext = this.textureCanvas.getContext('2d', {
            willReadFrequently: true
        });
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 10.8);
        pointLight.position.set(-5, 8, -5);
        this.scene.add(pointLight);
    }

    createObjects() {
        // Create plane
        const planeGeometry = new THREE.PlaneGeometry(20, 20);
        const planeMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            side: THREE.DoubleSide
        });
        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.rotation.x = -Math.PI / 2;
        this.plane.position.y = -2;
        this.plane.receiveShadow = true;
        this.scene.add(this.plane);

        // Create cube
        const geometry = new THREE.BoxGeometry(3, 3, 3);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            roughness: 0.2,
            metalness: 0.8
        });
        this.cube = new THREE.Mesh(geometry, material);
        this.cube.castShadow = true;
        this.cube.receiveShadow = true;
        this.cube.position.y = 1.5;
        this.scene.add(this.cube);
    }

    getScene() {
        return this.scene;
    }

    getCube() {
        return this.cube;
    }

    async addImagePlane(imageObject) {
        try {
            const scale = 5;
            const aspectRatio = imageObject.aspectRatio.width / imageObject.aspectRatio.height;
            const width = aspectRatio >= 1 ? scale : scale * aspectRatio;
            const height = aspectRatio >= 1 ? scale / aspectRatio : scale;

            // Create texture from raw pixel data
            const img = imageObject.imgElement;
            const imageWidth = img.naturalWidth;
            const imageHeight = img.naturalHeight;
            
            // Create data texture
            const data = new Uint8Array(imageWidth * imageHeight * 4);
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            tempCanvas.width = imageWidth;
            tempCanvas.height = imageHeight;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
            data.set(imageData.data);

            const texture = new THREE.DataTexture(
                data,
                imageWidth,
                imageHeight,
                THREE.RGBAFormat
            );
            texture.needsUpdate = true;

            const embedding = await this.imageProcessor.getImageEmbedding(imageObject.imgElement);
            const material = embedding 
                ? this.imageProcessor.mapEmbeddingToMaterial(embedding)
                : new THREE.MeshStandardMaterial({ side: THREE.DoubleSide });
            
            material.map = texture;

            const geometry = new THREE.PlaneGeometry(width, height);
            const plane = new THREE.Mesh(geometry, material);
            
            // Position plane
            const radius = 8;
            const angle = Math.random() * Math.PI * 2;
            plane.position.set(
                Math.cos(angle) * radius,
                1.5 + (Math.random() * 2 - 1),
                Math.sin(angle) * radius
            );
            
            plane.lookAt(this.cube.position);

            this.scene.add(plane);
            this.imagePlanes.add(plane);

            // Cleanup old planes if we have too many
            if (this.imagePlanes.size > 10) {
                const oldest = this.imagePlanes.values().next().value;
                if (oldest) {
                    this.scene.remove(oldest);
                    if (oldest.material.map) oldest.material.map.dispose();
                    oldest.material.dispose();
                    oldest.geometry.dispose();
                    this.imagePlanes.delete(oldest);
                }
            }
        } catch (error) {
            console.error('Error creating image plane:', error);
        }
    }
}