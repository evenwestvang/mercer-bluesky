import { Firehose } from "@skyware/firehose";
import { config } from '../constants.js';

const createFirehoseService = (messageHandler) => {
    const firehose = new Firehose({ relay: config.FIREHOSE_RELAY });
    
    const setupFirehose = () => {
        firehose.start();
        
        firehose.on("connect", () => {
            console.log("Connected to Firehose");
            firehose.subscribe({
                filter: { types: ['app.bsky.feed.post'] }
            });
        });

        firehose.on("commit", messageHandler);
        
        firehose.on("error", (error) => {
            console.error("Firehose error:", error);
            console.error("Error stack:", error.stack);
        });
        
        firehose.on("open", () => {
            console.log("Connected to Firehose.");
        });
        
        firehose.on("close", () => {
            console.log("Disconnected from Firehose. Attempting to reconnect...");
        });
    };

    return { setupFirehose };
};

export default createFirehoseService; 