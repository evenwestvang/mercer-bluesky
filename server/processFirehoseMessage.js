import { BskyAgent } from '@atproto/api';
import { classifyImages } from './imageClassification.js'

const agent = new BskyAgent({
    service: 'https://public.api.bsky.app'
});


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
            const classifications = await classifyImages(images)
            const imagesWithClassifications = images.map((image, index) => ({
                ...image,
                classification: classifications[index]
            }))

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