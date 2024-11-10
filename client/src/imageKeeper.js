
export function renderImage(imageData) {
    console.info(imageData)
    // Initialize canvas on first run
    if (!canvasContext) {
        canvasContext = initializeCanvas();
    }
    
    const { ctx, viewportWidth, viewportHeight } = canvasContext;
    
    // Create temporary image to load data
    const img = new Image();
    img.src = imageData;
    
    img.onload = () => {
        // Calculate scaled dimensions (max 300px)
        const scale = Math.min(300 / img.width, 300 / img.height, 1);
        const width = img.width * scale;
        const height = img.height * scale;
        
        // Calculate random position
        const randomX = Math.floor(Math.random() * (viewportWidth - width));
        const randomY = Math.floor(Math.random() * (viewportHeight - height));
        
        // Draw image to canvas
        ctx.drawImage(img, randomX, randomY, width, height);
    };
    
    return img; // Still return image for consistency with original API
}

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

// Store canvas context globally to avoid reinitializing
let canvasContext = null;
