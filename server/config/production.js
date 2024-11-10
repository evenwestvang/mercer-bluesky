export const config = {
    HTTP_PORT: process.env.HTTP_PORT || 3000,
    WS_PORT: process.env.WS_PORT || 3001,
    MAX_HISTORY: 100,
    BROADCAST_INTERVAL: 1000,
    FIREHOSE_RELAY: process.env.FIREHOSE_RELAY || 'wss://bsky.network'
}; 