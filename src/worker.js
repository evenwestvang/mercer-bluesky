
export class WebSocketConnection {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Set();
    this.messageHistory = [];
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