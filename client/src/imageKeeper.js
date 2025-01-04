const NSFW_THRESHOLD = 0.05; // 1% threshold

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

let allowNSFW = false;  // Default to safe mode

let isMouseDown = false;

let lastDisplayedImage = null;

document.addEventListener('DOMContentLoaded', () => {
    canvasContext = initializeCanvas();
    startAnimationLoop();
});

export function initializeImageKeeper({ allowNSFW: nsfw = false } = {}) {
    allowNSFW = nsfw;
}

export function addImage(imageObject) {

    // Content filtering
    const classification = imageObject.classification || [];

    if (classification.length == 0) {
        return null;
    }

    const isNSFW = classification.length == 0 || classification.some(c => 
        (c.className === 'Porn' || c.className === 'Hentai') && 
        c.probability > NSFW_THRESHOLD
    );

    if (!allowNSFW && isNSFW) {
        // console.warn('NSFW content filtered');
        return null;
    }

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
        if (Math.random() < 0.0015 && images.length > 7) {
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
