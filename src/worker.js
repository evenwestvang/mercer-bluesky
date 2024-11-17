import { BskyAgent } from '@atproto/api';

const agent = new BskyAgent({
    service: 'https://public.api.bsky.app'
});

// Add rate limiting configuration
const RATE_LIMIT = 4;
let requestCount = 0;
let lastReset = Date.now();

export class WebSocketConnection {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Set();
    this.messageHistory = [];
    this.jetstreamWs = null;
    this.setupJetstream();
  }

  async setupJetstream() {
    const connectJetstream = () => {
      this.jetstreamWs = new WebSocket('wss://jetstream1.us-east.bsky.network/subscribe');
      
      this.jetstreamWs.addEventListener('open', () => {
        console.log('Connected to Jetstream');
        this.jetstreamWs.send(JSON.stringify({
          "subscribe": ["app.bsky.feed.post"]
        }));
      });

      this.jetstreamWs.addEventListener('message', async (event) => {
        try {
          const message = JSON.parse(event.data);
          if (!message?.commit?.record?.embed?.images) return;

          // Rate limiting
          const now = Date.now();
          if (now - lastReset >= 1000) {
            requestCount = 0;
            lastReset = now;
          }
          if (requestCount >= RATE_LIMIT) return;
          requestCount++;
          const uri = `at://${message.did}/app.bsky.feed.post/${message.commit.rkey}`;

          const postResponse = await agent.api.app.bsky.feed.getPostThread({
            uri: uri,
            depth: 0
          });

          if (!postResponse.success || !postResponse.data?.thread?.post?.embed) return;

          const messageData = {
            uri,
            repo: message.repo,
            embed: postResponse.data.thread.post.embed
          };

          await this.handleMessage(messageData);
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      this.jetstreamWs.addEventListener('close', () => {
        console.log('Jetstream connection closed, reconnecting...');
        setTimeout(connectJetstream, 1000);
      });

      this.jetstreamWs.addEventListener('error', (error) => {
        console.error('Jetstream error:', error);
        this.jetstreamWs.close();
      });
    };

    connectJetstream();
  }

  async onConnect(webSocket) {
    this.sessions.add(webSocket);
    webSocket.accept();

    // Send message history to new client
    this.messageHistory.forEach(msg => {
      webSocket.send(JSON.stringify(msg));
    });

    webSocket.addEventListener('message', async ({data}) => {
      try {
        const message = JSON.parse(data);
        await this.handleMessage(message);
      } catch (err) {
        console.error('Error handling message:', err);
      }
    });

    webSocket.addEventListener('close', () => {
      this.sessions.delete(webSocket);
    });
  }

  async handleMessage(message) {
    // Store in history
    this.messageHistory.push(message);
    if (this.messageHistory.length > 50) {
      this.messageHistory.shift();
    }
    
    // Broadcast to all clients
    this.sessions.forEach(client => {
      client.send(JSON.stringify(message));
    });
  }
}

export class WebSocketServer {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.connection = new WebSocketConnection(state, env);
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const pair = new WebSocketPair();
    await this.connection.onConnect(pair[1]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const durableId = env.WEBSOCKET_SERVER.idFromName("default");
    const durableObject = env.WEBSOCKET_SERVER.get(durableId);
    return durableObject.fetch(request);
  }
};