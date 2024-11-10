import { BskyAgent } from '@atproto/api';

const agent = new BskyAgent({
    service: 'https://public.api.bsky.app'
});


export const processFirehoseMessage = (wsServer) => async (message) => {
    for (const op of message.ops) {
        const uri = `at://${message.repo}/app.bsky.feed.post/${op.path}`;
        
        if (op.action !== 'create' || !op.record?.embed?.images?.length) {
            continue;
        }

        try {
            const postResponse = await agent.api.app.bsky.feed.getPostThread({
                uri: uri
            });

            if (!postResponse.success || !postResponse.thread?.post?.embed?.images) {
                continue;
            }

            const messageData = {
                uri,
                op,
                repo: message.repo,
                embed: postResponse.thread.post.embed
            };

            wsServer.handleMessage(messageData);

        } catch (error) {
            console.error('Error fetching post data:', error);
            continue;
        }
    }
};