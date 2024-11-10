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
        const response = await fetch(imageUrl)
        const imageBuffer = await response.arrayBuffer()
        const imageTensor = tf.node.decodeImage(new Uint8Array(imageBuffer), 3)
        const predictions = await model.classify(imageTensor)
        imageTensor.dispose()
        return predictions
    } catch (error) {
        console.error('Error classifying image:', error)
        return null
    }
}

export const classifyImages = async (images) => {
    try {
        const imageUrls = images.map(img => img.fullsize)
        return await Promise.all(
            imageUrls.map(url => classifyImageFromUrl(url))
        )
    } catch (error) {
        console.error('Classification error:', error)
        return images.map(() => null)
    }
} 