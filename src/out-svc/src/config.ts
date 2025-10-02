export const config = {
  server: {
    port: parseInt(process.env.PORT || "3000", 10),
    host: process.env.HOST || "0.0.0.0",
  },
  dapr: {
    serverHost: process.env.DAPR_HOST || "127.0.0.1",
    serverPort: process.env.DAPR_HTTP_PORT || "3500",
    pubSubName: process.env.PUBSUB_NAME || "chatstream-pubsub",
    topicName: process.env.TOPIC_NAME || "chatstream-topic",
  },
  nats: {
    url: process.env.NATS_URL || "nats://localhost:4222",
  },
} as const;