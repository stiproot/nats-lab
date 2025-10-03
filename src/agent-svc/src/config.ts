export const config = {
  server: {
    port: parseInt(process.env.PORT || "3002", 10),
    host: process.env.HOST || "0.0.0.0",
  },
  dapr: {
    serverHost: process.env.DAPR_HOST || "127.0.0.1",
    serverPort: process.env.PORT || "3002",
    daprHost: process.env.DAPR_HOST || "127.0.0.1",
    daprPort: process.env.DAPR_HTTP_PORT || "3502",
    actorType: process.env.ACTOR_TYPE || "StateActor",
  },
  llm: {
    litellmUrl: process.env.LITELLM_URL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  },
} as const;
