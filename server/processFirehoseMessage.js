import { BskyAgent } from '@atproto/api';

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

            // Simple throttling - only process one message per second
            const now = Date.now();
            if (!processFirehoseMessage.lastProcessTime || now - processFirehoseMessage.lastProcessTime >= 1000) {
                processFirehoseMessage.lastProcessTime = now;
            } else {
                continue;
            }

            const postResponse = await agent.api.app.bsky.feed.getPostThread({
                uri: uri,
                depth: 0
            });

    
            if (!postResponse.success || !postResponse.data?.thread?.post?.embed) {
                continue;
            }

            const messageData = {
                uri,
                op,
                repo: message.repo,
                embed: postResponse.data.thread.post.embed
            };

            wsServer.handleMessage(messageData);

        } catch (error) {
            console.error('Error fetching post data:', error);
            continue;
        }
    }
};