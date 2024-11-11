import { BskyAgent } from '@atproto/api';
import { classifyImages } from './imageClassification.js'

const agent = new BskyAgent({
    service: 'https://public.api.bsky.app'
});

// Add timing tracking
let currentlyProcessing = 0;
const MAX_CONCURRENT = 4;
const processingTimes = [];

export const processFirehoseMessage = (wsServer) => async (message) => {
    for (const op of message.ops) {
        const uri = `at://${message.repo}/app.bsky.feed.post/${op.path.split('/').pop()}`;

        
        if (op.action !== 'create' || !op.record?.embed?.images?.length) {
            continue;
        }

        try {

            const postResponse = await agent.api.app.bsky.feed.getPostThread({
                uri: uri,
                depth: 0
            });

    
            if (!postResponse.success || !postResponse.data?.thread?.post?.embed) {
                continue;
            }

            const images = postResponse.data.thread.post.embed.images
            
            // Only process images if we're under the limit
            const availableSlots = MAX_CONCURRENT - currentlyProcessing;
            const imagesToProcess = images.slice(0, availableSlots);
            
            if (imagesToProcess.length === 0) {
                // console.log('Skipping images, at concurrent processing limit');
                continue;
            }

            currentlyProcessing += imagesToProcess.length;
            try {
                const startTime = performance.now();
                const classifications = await classifyImages(imagesToProcess);
                const processingTime = performance.now() - startTime;
                
                // Track processing time for each image
                imagesToProcess.forEach(() => {
                    processingTimes.push(processingTime / imagesToProcess.length);
                });

                // Log average processing time
                const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
                console.log(`Average processing time per image: ${avgTime.toFixed(2)}ms`);

                const imagesWithClassifications = imagesToProcess.map((image, index) => ({
                    ...image,
                    classification: classifications[index],
                    processingTime: processingTime / imagesToProcess.length
                }));

                const messageData = {
                    uri,
                    op,
                    repo: message.repo,
                    embed: {
                        ...postResponse.data.thread.post.embed,
                        images: imagesWithClassifications
                    },
                };

                wsServer.handleMessage(messageData);
            } finally {
                currentlyProcessing -= imagesToProcess.length;
            }

        } catch (error) {
            console.error('Error fetching post data:', error);
            continue;
        }
    }
};