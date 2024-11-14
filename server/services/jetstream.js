import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

const createJetstreamService = (messageHandler) => {
    const jetstream = new Jetstream({
        wantedCollections: ["app.bsky.feed.post"],
        ws: WebSocket
    });
    
    const setupJetstream = () => {


        jetstream.onCreate("app.bsky.feed.post", (event) => {
            messageHandler(event);
        });
        
        // jetstream.onDelete("app.bsky.feed.post", (event) => {
        //     console.log(`Deleted post: ${event.commit.rkey}`)
        // });        


        // jetstream.on("error", (error) => {
        //     console.error("Jetstream error:", error);
        //     console.error("Error stack:", error.stack);
        // });
        
        jetstream.on("connect", () => {
            console.log("Connected to Jetstream");
        });
        
        jetstream.on("close", () => {
            console.log("Disconnected from Jetstream. Attempting to reconnect...");
        });
        
        jetstream.start();
    };

    return { setupJetstream };
};

export default createJetstreamService; 