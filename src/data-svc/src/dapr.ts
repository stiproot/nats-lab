import { DaprClient, ActorId } from "@dapr/dapr";
import { config } from "./config.js";
import type { DaprService, MessageHandler, CloudEvent } from "./types.js";
import type { Express } from "express";

// Define the Data Actor interface for type-safe actor invocation
class DataActor {
  async persistData(data: CloudEvent): Promise<void> {
    // This is a proxy - implementation will be in the actual actor
  }
}

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
  app.post("/dapr/messages", async (req, res) => {
    console.log("Request headers:", req.headers);
    console.log("Request content-type:", req.get("content-type"));
    console.log("Raw request body:", JSON.stringify(req.body, null, 2));

    const data = req.body?.data || req.body;
    console.log("Received message from NATS:", data);

    try {
      // Extract actor ID from CloudEvent
      const cloudEvent = data as CloudEvent;

      if (!cloudEvent.id) {
        console.error("Message missing id field:", data);
        res.status(400).json({
          success: false,
          error: "Missing id field in CloudEvent"
        });
        return;
      }

      const actorId = cloudEvent.id;
      console.log(`Processing message for actor: ${actorId}`);

      // Use Dapr state store directly to persist actor state
      await daprClient.state.save("statestore", [
        {
          key: `${config.dapr.actorType}||${actorId}`,
          value: cloudEvent,
        },
      ]);

      console.log(`Data persisted for actor: ${actorId}`);

      // Call custom message handler if registered
      if (messageHandler) {
        await messageHandler(data);
      }

      res.json({ success: true, actorId });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  return {
    async start(): Promise<void> {
      console.log("Dapr client initialized");
      console.log(`Subscribing to: ${config.dapr.pubSubName}/${config.dapr.topicName}`);
      console.log(`Actor type: ${config.dapr.actorType}`);
    },

    async stop(): Promise<void> {
      console.log("Dapr client stopped");
    },

    subscribe(handler: MessageHandler): void {
      messageHandler = handler;
    },
  };
}
