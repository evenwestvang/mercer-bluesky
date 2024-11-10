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

export function addImage(imageObject) {
    // Content filtering
    const classification = imageObject.classification || [];
    
    const isNSFW = classification.some(c => 
        (c.className === 'Porn' || c.className === 'Hentai') && 
        c.probability > NSFW_THRESHOLD
    );

    if (isNSFW) {
        console.warn('NSFW content filtered');
        return null;
    }

    if (images.length >= MAX_IMAGES) {
        images.shift(); // Remove oldest image
    }

    // Initialize canvas on first run
    if (!canvasContext) {
        canvasContext = initializeCanvas();
        startAnimationLoop();
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
    
    // Handle retina displays
    const dpr = window.devicePixelRatio || 1;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Set canvas size accounting for device pixel ratio
    canvas.width = viewportWidth * dpr;
    canvas.height = viewportHeight * dpr;
    
    // Scale canvas CSS dimensions
    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;
    
    // Scale context to match device pixel ratio
    ctx.scale(dpr, dpr);
    
    // Add canvas to DOM
    document.body.appendChild(canvas);
    
    return { canvas, ctx, viewportWidth, viewportHeight };
};
