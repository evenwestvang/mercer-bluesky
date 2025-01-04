import * as nsfwjs from 'nsfwjs'
import * as tf from '@tensorflow/tfjs-node'

// Cache the model globally
let modelInstance = null

const loadModel = async () => {
    if (!modelInstance) {
        modelInstance = await nsfwjs.load()
    }
    return modelInstance
}

const classifyImageFromUrl = async (imageUrl) => {
    try {
        const model = await loadModel()
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch(imageUrl, {
            signal: controller.signal,
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const imageBuffer = await response.arrayBuffer()
        const imageTensor = tf.node.decodeImage(new Uint8Array(imageBuffer), 3)
        const predictions = await model.classify(imageTensor)
        imageTensor.dispose()
        return predictions
    } catch (error) {
        if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
            // Quiet timeout errors
            return null
        }
        console.error('Image classification error:', {
            url: imageUrl,
            error: error.message
        })
        return null
    }
}

export const classifyImages = async (images) => {
    const results = await Promise.all(
        images.map(img => classifyImageFromUrl(img.thumb))
    )
    return results
}