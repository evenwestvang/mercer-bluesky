import { BskyAgent } from '@atproto/api';
import { classifyImages } from './imageClassification.js'

const agent = new BskyAgent({
    service: 'https://public.api.bsky.app'
});

// Add rate limiting configuration
const RATE_LIMIT = 4; // requests per second
let requestCount = 0;
let lastReset = Date.now();

export const processJetstreamMessage = (wsServer) => async (message) => {
    // Reset counter every second
    const now = Date.now();
    if (now - lastReset >= 1000) {
        requestCount = 0;
        lastReset = now;
    }

    const uri = `at://${message.did}/app.bsky.feed.post/${message.commit.rkey}`;

    if (message.commit.operation !== 'create' || !message.commit.record?.embed?.images?.length) {
        return
    }

    try {
        const postResponse = await agent.api.app.bsky.feed.getPostThread({
            uri: uri,
            depth: 0
        });

        if (!postResponse.success || !postResponse.data?.thread?.post?.embed) {
            return
        }

        const images = postResponse.data.thread.post.embed.images;
        let classifications = Array(images.length).fill(null);

        // Only classify images if we're under rate limit
        if (requestCount < RATE_LIMIT) {
            requestCount++;
            classifications = await classifyImages(images)
                .catch(error => {
                    console.error('Error classifying images:', error);
                    return Array(images.length).fill(null);
                });
        }

        const imagesWithClassifications = images.map((image, index) => ({
            ...image,
            classification: classifications[index],
        }));

        const messageData = {
            uri,
            repo: message.repo,
            embed: {
                ...postResponse.data.thread.post.embed,
                images: imagesWithClassifications
            },
        };

        wsServer.handleMessage(messageData);

    } catch (error) {
        console.error('Error fetching post data:', error);
        return;
    }
};