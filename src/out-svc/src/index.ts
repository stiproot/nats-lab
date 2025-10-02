import express from "express";
import { createServer } from "http";
import { config } from "./config.js";
import { createWebSocketService } from "./websocket.js";
import { createDaprService } from "./dapr.js";

async function main() {
  // Initialize Express app
  const app = express();
  app.use(express.json());
  app.use(express.json({ type: 'application/cloudevents+json' }));

  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize WebSocket service
  const wsService = createWebSocketService(httpServer);

  // Initialize Dapr service with Express app
  const daprService = createDaprService(app);

  // Connect Dapr messages to WebSocket routing
  daprService.subscribe((data) => {
    // Type guard to check if data has user_id
    if (typeof data === "object" && data !== null && "user_id" in data) {
      const message = data as { user_id: string; [key: string]: unknown };
      const userId = message.user_id;

      if (typeof userId === "string" && userId.length > 0) {
        // Send message to specific user
        const sent = wsService.sendToUser(userId, data);
        if (!sent) {
          console.warn(`Failed to deliver message to user_id: ${userId}`);
        }
      } else {
        console.warn("Invalid user_id in message:", data);
      }
    } else {
      console.warn("Message missing user_id field:", data);
    }
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      clients: wsService.getClientCount(),
    });
  });

  // Start Dapr server
  await daprService.start();

  // Start HTTP server
  httpServer.listen(config.server.port, config.server.host, () => {
    console.log(`Server running on http://${config.server.host}:${config.server.port}`);
    console.log(`WebSocket server ready`);
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("SIGTERM signal received: closing HTTP server");
    await daprService.stop();
    httpServer.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", async () => {
    console.log("SIGINT signal received: closing HTTP server");
    await daprService.stop();
    httpServer.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
