import { DaprClient } from "@dapr/dapr";
import { config } from "./config.js";
import type { DaprService, MessageHandler } from "./types.js";
import type { Express } from "express";

export function createDaprService(app: Express): DaprService {
  const daprClient = new DaprClient({
    daprHost: config.dapr.daprHost,
    daprPort: config.dapr.daprPort,
  });

  let messageHandler: MessageHandler | null = null;

  // Register Dapr subscription endpoint
  app.get("/dapr/subscribe", (req, res) => {
    res.json([
      {
        pubsubname: config.dapr.pubSubName,
        topic: config.dapr.topicName,
        route: "/dapr/messages",
      },
    ]);
  });

  // Handle incoming messages from Dapr
  app.post("/dapr/messages", (req, res) => {
    console.log("Request headers:", req.headers);
    console.log("Request content-type:", req.get('content-type'));
    console.log("Raw request body:", JSON.stringify(req.body, null, 2));
    console.log("Body keys:", req.body ? Object.keys(req.body) : 'body is falsy');

    const data = req.body?.data || req.body;
    console.log("Received message from NATS:", data);

    if (messageHandler) {
      messageHandler(data);
    }

    res.json({ success: true });
  });

  return {
    async start(): Promise<void> {
      console.log("Dapr client initialized");
    },

    async stop(): Promise<void> {
      console.log("Dapr client stopped");
    },

    subscribe(handler: MessageHandler): void {
      messageHandler = handler;
    },

    getClient(): DaprClient {
      return daprClient;
    },
  };
}