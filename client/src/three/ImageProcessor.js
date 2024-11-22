
import * as tf from '@tensorflow/tfjs';
import * as THREE from 'three';

export class ImageProcessor {
    constructor() {
        this.model = null;
        this.loadModel();
    }

    async loadModel() {
        this.model = await tf.loadGraphModel(
            'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1',
            { fromTFHub: true }
        );
        console.log('TensorFlow model loaded');
    }

    async getImageEmbedding(imgElement) {
        if (!this.model) {
            console.warn('Model not loaded yet');
            return null;
        }

        const tensor = tf.tidy(() => {
            return tf.browser.fromPixels(imgElement)
                .resizeNearestNeighbor([224, 224])
                .toFloat()
                .expandDims()
                .div(255);
        });

        try {
            const embeddings = await this.model.predict(tensor).data();
            return Array.from(embeddings);
        } finally {
            tensor.dispose();
        }
    }

    mapEmbeddingToColor(embedding) {
        // Use first 3 components for RGB
        const r = Math.abs(embedding[0]);
        const g = Math.abs(embedding[1]);
        const b = Math.abs(embedding[2]);
        
        // Normalize to 0-1 range
        const max = Math.max(r, g, b, 1);
        return new THREE.Color(r/max, g/max, b/max);
    }

    mapEmbeddingToMaterial(embedding) {
        const color = this.mapEmbeddingToColor(embedding);
        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: Math.abs(embedding[3] || 0.5),
            metalness: Math.abs(embedding[4] || 0.5)
        });
    }
}