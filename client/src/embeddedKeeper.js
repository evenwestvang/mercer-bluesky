<<<<<<< HEAD

// Store both canvas context and images array globally
let canvasContext = null;
let images = [];

const MAX_IMAGES = 20;
let currentImage = null;
let blackPause = 0;
let ticksTillNextImage = 0;
let isClear = false;

const States = {
    NORMAL: 'normal',
    EXPLORE: 'explore'
};
let currentState = States.NORMAL;

let isMouseDown = false;

let lastDisplayedImage = null;

document.addEventListener('DOMContentLoaded', () => {
    canvasContext = initializeCanvas();
    startAnimationLoop();
});

export function initializeImageKeeper() {
}

export function addImage(imageObject) {

    if (images.length >= MAX_IMAGES) {
        images.shift(); // Remove oldest image
    }

    // Create and load image
    const img = new Image();
    img.src = imageObject.fullsize;
    
    img.onload = () => {
        // Calculate scaled dimensions (max 300px)
        const scale = Math.min(300 / img.width, 300 / img.height, 1);
        const width = img.width * scale;
        const height = img.height * scale;
        
        // Store image with its dimensions and random position
        images.push({
            element: img,
            width,
            height,
            x: Math.floor(Math.random() * (canvasContext.viewportWidth - width)),
            y: Math.floor(Math.random() * (canvasContext.viewportHeight - height))
        });
    };
    
    return img;
}

const drawFrame = () => {
    const { ctx, viewportWidth, viewportHeight } = canvasContext;
    
    // Skip all drawing logic if mouse is down
    if (!isMouseDown) {
        // Randomly clear image array
        if (Math.random() < 0.002 && images.length > 5) {
            images = [];
            ticksTillNextImage = 20 + Math.floor(Math.random() * 30);
        }

        // Handle tick counter
        if (ticksTillNextImage > 0) {
            ticksTillNextImage--;
        }

        // Main drawing logic
        if (blackPause === 0 && images.length > 0) {
            isClear = false;

            if (currentState === States.EXPLORE) {
                const size = Math.random() * 0.6;
                const sourceWidth = currentImage.element.width * size;
                const sourceHeight = currentImage.element.height * size;
                const x = sourceWidth * Math.random();
                const y = sourceHeight * Math.random();

                ctx.drawImage(
                    currentImage.element, 
                    x, y, sourceWidth, sourceHeight,
                    0, 0, viewportWidth, viewportHeight
                );

                if (Math.random() < 0.2) {
                    currentState = States.NORMAL;
                }
                blackPause = 1;
            }

            if (currentState === States.NORMAL) {
                if (!currentImage || Math.random() < 0.7) {
                    currentImage = images[Math.floor(Math.random() * images.length)];
                }

                ctx.drawImage(
                    currentImage.element,
                    0, 0, viewportWidth, viewportHeight
                );

                if (Math.random() < 0.15) {
                    currentState = States.EXPLORE;
                }

                // Set black pause duration based on number of images
                if (images.length < 5) {
                    blackPause = Math.floor(Math.random() * (MAX_IMAGES - images.length) * 3);
                } else if (images.length < 10) {
                    blackPause = Math.floor(Math.random() * 4);
                } else {
                    blackPause = Math.floor(Math.random() * 2);
                }

                isClear = false;
            }

            // Store the last successfully drawn image
            if (currentImage && !isClear) {
                lastDisplayedImage = currentImage;
            }
        } else {
            if (!isClear && Math.random() < 0.8) {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, viewportWidth, viewportHeight);
                isClear = true;
            }
            if (blackPause > 0) {
                blackPause--;
            }
        }
    } else if (lastDisplayedImage) {
        // When mouse is down, keep showing the last displayed image
        ctx.drawImage(
            lastDisplayedImage.element,
            0, 0, viewportWidth, viewportHeight
        );
    }

    requestAnimationFrame(drawFrame);
};

// Replace existing startAnimationLoop with:
const startAnimationLoop = () => {
    const { ctx } = canvasContext;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasContext.viewportWidth, canvasContext.viewportHeight);
    
    requestAnimationFrame(drawFrame);
};

const initializeCanvas = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Move viewport sizing logic to separate function for reuse
    const updateCanvasSize = () => {
        const dpr = window.devicePixelRatio || 1;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        canvas.width = viewportWidth * dpr;
        canvas.height = viewportHeight * dpr;
        canvas.style.width = `${viewportWidth}px`;
        canvas.style.height = `${viewportHeight}px`;
        
        ctx.scale(dpr, dpr);
        
        return { viewportWidth, viewportHeight };
    };
    
    // Initial canvas setup
    const viewport = updateCanvasSize();
    
    // Add resize listener
    window.addEventListener('resize', () => {
        const newViewport = updateCanvasSize();
        canvasContext.viewportWidth = newViewport.viewportWidth;
        canvasContext.viewportHeight = newViewport.viewportHeight;
    });
    
    // Combined mouse and touch event handlers
    const handleStart = () => isMouseDown = true;
    const handleEnd = () => isMouseDown = false;
    
    // Mouse events
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);
    
    // Touch events
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling/zooming
        handleStart();
    });
    canvas.addEventListener('touchend', handleEnd);
    canvas.addEventListener('touchcancel', handleEnd);
    
    document.body.appendChild(canvas);
    
    return { 
        canvas, 
        ctx, 
        viewportWidth: viewport.viewportWidth, 
        viewportHeight: viewport.viewportHeight 
    };
};
=======
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let scene, camera, renderer, cube, controls, plane;
let initialized = false; // Add initialization flag

// Remove the DOMContentLoaded listener
// document.addEventListener('DOMContentLoaded', () => {
//     initializeImageKeeper();
// });

export function initializeImageKeeper() {
    // Prevent multiple initializations
    if (initialized) {
        console.log('Already initialized');
        return;
    }
    initialized = true;

    // Create scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    
    // Enhance renderer settings
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Better lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 10.8);
    pointLight.position.set(-5, 8, -5);
    scene.add(pointLight);

    // Add plane first
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        side: THREE.DoubleSide
    });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -2;
    plane.receiveShadow = true;
    scene.add(plane);

    // Enhanced cube material
    const geometry = new THREE.BoxGeometry(3, 3, 3);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x666666,
        roughness: 0.2,
        metalness: 0.8
    });
    cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.position.y = 1.5; // Lift cube above plane
    scene.add(cube);

    // Better camera position
    camera.position.set(10, 6, 10);
    camera.lookAt(cube.position);

    // Enhanced controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    // controls.autoRotate = true;
    // controls.autoRotateSpeed = 2.0;
    controls.enablePan = false; // Disable panning for cleaner orbit
    controls.target.set(0, 1.5, 0); // Set orbit target to cube center
    controls.update();

    // Better event handling
    const container = renderer.domElement;
    container.style.cursor = 'grab';
    

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    animate();
}

export function addImage(imageObject) {
    // console.log('addImage', imageObject);
    // TODO: Implement texture mapping on cube faces
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Required for damping
    renderer.render(scene, camera);
}
