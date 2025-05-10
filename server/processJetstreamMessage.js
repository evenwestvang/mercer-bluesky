import { BskyAgent } from '@atproto/api';
import { classifyImages } from './imageClassification.js';
import os from 'os';

const agent = new BskyAgent({
    service: 'https://public.api.bsky.app',
    timeout: 10000  // 10 second timeout
});

// Create a worker pool based on available CPU cores (leave one core free)
const MAX_CONCURRENT = Math.max(1, os.cpus().length);
const MAX_QUEUE_SIZE = MAX_CONCURRENT * 2; // Only keep 2x worker count items
let activeWorkers = 0;
const workQueue = [];

const processQueue = () => {
    // Process next item if we have capacity and queue items
    while (activeWorkers < MAX_CONCURRENT && workQueue.length > 0) {
        const nextWork = workQueue.shift();
        processWorkItem(nextWork);
    }
};

const processWorkItem = async ({ message, wsServer }) => {
    activeWorkers++;
    try {
        const uri = `at://${message.did}/app.bsky.feed.post/${message.commit.rkey}`;
        
        // Add retry logic for API calls
        let retries = 3;
        let postResponse;
        
        while (retries > 0) {
            try {
                postResponse = await agent.api.app.bsky.feed.getPostThread({
                    uri: uri,
                    depth: 0
                });
                break; // Success, exit retry loop
            } catch (error) {
                retries--;
                if (retries === 0) {
                    throw error; // Re-throw if all retries failed
                }
                console.log(`Retrying API call, ${retries} attempts remaining`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
        }

        if (!postResponse?.success || !postResponse?.data?.thread?.post?.embed) {
            console.log('No valid post data found:', { uri, success: postResponse?.success });
            return;
        }

        const images = postResponse.data.thread.post.embed.images;
        const classifications = await classifyImages(images);

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
        console.error('Error processing work item:', error);
        if (error.cause) {
            console.error('Caused by:', error.cause);
        }
    } finally {
        activeWorkers--;
        // Try to process next item in queue
        processQueue();
    }
};

export const processJetstreamMessage = (wsServer) => (message) => {
    if (message.commit.operation !== 'create' || !message.commit.record?.embed?.images?.length) {
        return;
    }

    // Drop if queue is at capacity
    if (workQueue.length >= MAX_QUEUE_SIZE) {
        return;
    }

    // Add work to queue
    workQueue.push({ message, wsServer });
    
    // Try to process queue
    processQueue();
};
