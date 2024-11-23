export class ImageLoader {
    static async loadImageWithProxy(url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        return new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = url;
        });
    }

    static async loadImageWithCanvas(url) {
        try {
            console.log('Loading image from URL:', url);
            const proxyUrl = `/proxy-image?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const img = new Image();
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.toBlob((blob) => {
                        const newObjectUrl = URL.createObjectURL(blob);
                        const newImg = new Image();
                        newImg.crossOrigin = 'anonymous';
                        
                        newImg.onload = () => {
                            URL.revokeObjectURL(objectUrl);
                            resolve(newImg);
                        };
                        
                        newImg.onerror = (e) => {
                            console.error('Error loading processed image:', e);
                            URL.revokeObjectURL(objectUrl);
                            URL.revokeObjectURL(newObjectUrl);
                            reject(new Error('Failed to load processed image'));
                        };
                        
                        newImg.src = newObjectUrl;
                    }, 'image/png');
                };
                
                img.onerror = (e) => {
                    console.error('Error loading original image:', e);
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error('Failed to load original image'));
                };
                
                img.src = objectUrl;
            });
        } catch (error) {
            console.error('Error in loadImageWithCanvas:', error);
            throw error;
        }
    }

    static isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }

    static async loadTextureWithGL(gl, url) {
        try {
            const img = await this.loadImageWithCanvas(url);
            
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            
            if (this.isPowerOf2(img.width) && this.isPowerOf2(img.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
            
            return texture;
        } catch (error) {
            console.error('Error loading texture:', error);
            throw error;
        }
    }
}