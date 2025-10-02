import { DaprServer } from "@dapr/dapr";
import { config } from "./config.js";
import type { DaprService, MessageHandler } from "./types.js";

export function createDaprService(): DaprService {
  const daprServer = new DaprServer({
    serverHost: config.dapr.serverHost,
    serverPort: config.dapr.serverPort,
    clientOptions: {
      daprHost: config.dapr.daprHost,
      daprPort: config.dapr.daprPort,
    },
  });

  let messageHandler: MessageHandler | null = null;

  // Subscribe to NATS topic via Dapr
  daprServer.pubsub.subscribe(
    config.dapr.pubSubName,
    config.dapr.topicName,
    async (data: unknown) => {
      console.log("Received message from NATS:", data);

      if (messageHandler) {
        messageHandler(data);
      }

      return { success: true };
    }
  );

  return {
    async start(): Promise<void> {
      await daprServer.start();
      console.log("Dapr server started");
    },

    async stop(): Promise<void> {
      await daprServer.stop();
      console.log("Dapr server stopped");
    },

    subscribe(handler: MessageHandler): void {
      messageHandler = handler;
    },
  };
}