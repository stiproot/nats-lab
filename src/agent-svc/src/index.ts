import express from "express";
import { config } from "./config.js";
import { runQueryActorEffect } from "./agent-service.js";
import type { AgentQueryRequest } from "./types.js";

async function main() {
  // Initialize Express app
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      service: "agent-svc",
    });
  });

  // Main agent query endpoint
  app.post("/qry/agent", async (req, res) => {
    try {
      const request = req.body as AgentQueryRequest;

      // Validate request
      if (!request.actorId || !request.question) {
        res.status(400).json({
          error: "Missing required fields: actorId and question",
        });
        return;
      }

      console.log(`Received query for actor: ${request.actorId}`);
      console.log(`Question: ${request.question}`);

      // Execute the Effect program with LangGraph workflow
      const result = await runQueryActorEffect(
        request,
        config.dapr.daprHost,
        config.dapr.daprPort,
        config.dapr.actorType
      );

      res.json(result);
    } catch (error) {
      console.error("Error processing agent query:", error);
      res.status(500).json({
        error: "Failed to process agent query",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Start HTTP server
  app.listen(config.server.port, config.server.host, () => {
    console.log(`Agent Service running on http://${config.server.host}:${config.server.port}`);
    console.log(`Dapr sidecar: ${config.dapr.daprHost}:${config.dapr.daprPort}`);
    console.log(`Actor type: ${config.dapr.actorType}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("Shutting down gracefully...");
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error) => {
  console.error("Failed to start agent service:", error);
  process.exit(1);
});
