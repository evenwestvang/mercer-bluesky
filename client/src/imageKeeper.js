

export function renderImage(imageData) {
    const img = document.createElement('img');
    img.src = imageData;
    
    // Set absolute positioning
    img.style.position = 'absolute';
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Set initial size constraints to ensure image fits
    img.style.maxWidth = '300px';
    img.style.maxHeight = '300px';
    
    // Wait for image to load to get its dimensions
    img.onload = () => {
        // Calculate random position within bounds
        const maxX = viewportWidth - img.offsetWidth;
        const maxY = viewportHeight - img.offsetHeight;
        
        const randomX = Math.floor(Math.random() * maxX);
        const randomY = Math.floor(Math.random() * maxY);
        
        img.style.left = randomX + 'px';
        img.style.top = randomY + 'px';
    };

    // Add to DOM immediately
    document.body.appendChild(img);
    return img;
}