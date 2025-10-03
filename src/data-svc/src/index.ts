import express from "express";
import { config } from "./config.js";
import { createDaprService } from "./dapr.js";

async function main() {
  // Initialize Express app
  const app = express();
  app.use(express.json());
  app.use(express.json({ type: "application/cloudevents+json" }));

  // Initialize Dapr service
  const daprService = createDaprService(app);

  // Optional: Subscribe to messages for additional processing
  daprService.subscribe((data) => {
    console.log("Additional message processing:", data);
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      service: "data-svc",
    });
  });

  // Start Dapr service
  await daprService.start();

  // Start HTTP server
  app.listen(config.server.port, config.server.host, () => {
    console.log(`Data Service running on http://${config.server.host}:${config.server.port}`);
    console.log(`Dapr sidecar: ${config.dapr.daprHost}:${config.dapr.daprPort}`);
    console.log(`Subscribed to: ${config.dapr.pubSubName}/${config.dapr.topicName}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down gracefully...");
    await daprService.stop();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error) => {
  console.error("Failed to start data service:", error);
  process.exit(1);
});
