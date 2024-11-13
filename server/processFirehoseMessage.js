import { BskyAgent } from '@atproto/api';
import { classifyImages } from './imageClassification.js'

const agent = new BskyAgent({
    service: 'https://public.api.bsky.app'
});

// Add rate limiting configuration
const RATE_LIMIT = 4; // requests per second
let requestCount = 0;
let lastReset = Date.now();

export const processFirehoseMessage = (wsServer) => async (message) => {
    // Reset counter every second
    const now = Date.now();
    if (now - lastReset >= 1000) {
        requestCount = 0;
        lastReset = now;
    }

    for (const op of message.ops) {
        const uri = `at://${message.repo}/app.bsky.feed.post/${op.path.split('/').pop()}`;

        if (op.action !== 'create' || !op.record?.embed?.images?.length) {
            continue;
        }

        // Skip if we're over the rate limit
        if (requestCount >= RATE_LIMIT) {
            continue;
        }
        requestCount++;

        try {
            const postResponse = await agent.api.app.bsky.feed.getPostThread({
                uri: uri,
                depth: 0
            });

            if (!postResponse.success || !postResponse.data?.thread?.post?.embed) {
                continue;
            }

            const images = postResponse.data.thread.post.embed.images
            
            const classifications = await classifyImages(images)
                .catch(error => {
                    console.error('Error classifying images:', error);
                    return Array(images.length).fill(null);
                });

            const imagesWithClassifications = images.map((image, index) => ({
                ...image,
                classification: classifications[index],
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

        } catch (error) {
            console.error('Error fetching post data:', error);
            continue;
        }
    }
};