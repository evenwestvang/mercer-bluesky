const NSFW_THRESHOLD = 0.05; // 1% threshold

// Store both canvas context and images array globally
let canvasContext = null;
let images = [];

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

const drawRandomImage = (ctx, viewportWidth, viewportHeight) => {
    if (images.length === 0) return;
    
    // Select random image
    const img = images[Math.floor(Math.random() * images.length)];
    
    // Calculate random position
    const x = Math.floor(Math.random() * (viewportWidth - img.width));
    const y = Math.floor(Math.random() * (viewportHeight - img.height));
    
    ctx.drawImage(img.element, x, y, img.width, img.height);
};

const startAnimationLoop = () => {
    const draw = () => {
        const { ctx, viewportWidth, viewportHeight } = canvasContext;
        
        
        // Draw single random image
        drawRandomImage(ctx, viewportWidth, viewportHeight);
        
        // Request next frame
        requestAnimationFrame(draw);
    };
    
    // Start the animation loop
    requestAnimationFrame(draw);
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
