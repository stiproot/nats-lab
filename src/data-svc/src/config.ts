export const config = {
  server: {
    port: parseInt(process.env.PORT || "3002", 10),
    host: process.env.HOST || "0.0.0.0",
  },
  dapr: {
    daprHost: process.env.DAPR_HOST || "127.0.0.1",
    daprPort: process.env.DAPR_HTTP_PORT || "3502",
    pubSubName: process.env.PUBSUB_NAME || "ctx-pubsub",
    topicName: process.env.TOPIC_NAME || "ctx-subj",
    actorType: process.env.ACTOR_TYPE || "DataActor",
  },
} as const;
