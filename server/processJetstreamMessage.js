import { BskyAgent } from '@atproto/api';
// import { classifyImages } from './imageClassification.js'; // LLM model import disabled for debugging
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
    const workItemUri = message?.did && message?.commit?.rkey ? `at://${message.did}/app.bsky.feed.post/${message.commit.rkey}` : 'Unknown URI';
    console.log(`[${workItemUri}] Starting to process work item. Active workers: ${activeWorkers}`);

    try {
        const uri = `at://${message.did}/app.bsky.feed.post/${message.commit.rkey}`;
        console.log(`[${uri}] Fetching post thread.`);
        
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
                    console.error(`[${uri}] API call failed after multiple retries.`);
                    throw error; // Re-throw if all retries failed
                }
                console.log(`[${uri}] Retrying API call, ${retries} attempts remaining`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
        }
        console.log(`[${uri}] Successfully fetched post thread.`);

        if (!postResponse?.success || !postResponse?.data?.thread?.post?.embed) {
            console.log(`[${uri}] No valid post data found:`, { success: postResponse?.success });
            return;
        }

        const images = postResponse.data.thread.post.embed.images;
        // const classifications = await classifyImages(images); // LLM model call disabled for debugging

        const imagesWithClassifications = images.map((image, index) => ({
            ...image,
            // classification: classifications[index], // Original line
            classification: null, // Set to null as we've disabled classification
        }));

        const originalEmbed = postResponse.data.thread.post.embed;

        const messageData = {
            uri,
            repo: message.repo,
            embed: {
                images: imagesWithClassifications,
            },
        };

        wsServer.handleMessage(messageData);
        console.log(`[${uri}] Successfully processed and broadcasted message.`);

    } catch (error) {
        console.error(`[${workItemUri}] Error processing work item:`, error);
        if (error.cause) {
            console.error(`[${workItemUri}] Caused by:`, error.cause);
        }
    } finally {
        activeWorkers--;
        console.log(`[${workItemUri}] Finished processing work item. Active workers: ${activeWorkers}`);
        // Try to process next item in queue
        processQueue();
    }
};

export const processJetstreamMessage = (wsServer) => (message) => {
    const initialUri = message?.commit?.cid && message?.did ? `at://${message.did}/app.bsky.feed.post/${message.commit.rkey}` : 'Incoming Jetstream message (pre-processing)';
    console.log(`[${initialUri}] Received Jetstream message. Operation: ${message?.commit?.operation}, Images: ${message?.commit?.record?.embed?.images?.length || 0}`);

    if (message.commit.operation !== 'create' || !message.commit.record?.embed?.images?.length) {
        console.log(`[${initialUri}] Skipping message: Not a create operation or no images.`);
        return;
    }

    // Drop if queue is at capacity
    if (workQueue.length >= MAX_QUEUE_SIZE) {
        console.warn(`[${initialUri}] Work queue is full (${workQueue.length}/${MAX_QUEUE_SIZE}). Dropping message.`);
        return;
    }

    // Add work to queue
    console.log(`[${initialUri}] Adding message to work queue. Queue size: ${workQueue.length + 1}`);
    workQueue.push({ message, wsServer });
    
    // Try to process queue
    processQueue();
};
