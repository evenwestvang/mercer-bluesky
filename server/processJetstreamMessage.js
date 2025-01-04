import { BskyAgent } from '@atproto/api';
import { classifyImages } from './imageClassification.js';
import os from 'os';

const agent = new BskyAgent({
    service: 'https://public.api.bsky.app'
});

// Create a worker pool based on available CPU cores (leave one core free)
const MAX_CONCURRENT = Math.max(1, os.cpus().length - 1);
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
        
        const postResponse = await agent.api.app.bsky.feed.getPostThread({
            uri: uri,
            depth: 0
        });

        if (!postResponse.success || !postResponse.data?.thread?.post?.embed) {
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