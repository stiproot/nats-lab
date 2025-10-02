import { WebSocketServer, WebSocket } from "ws";
import type { Server, IncomingMessage } from "http";
import type { WebSocketService } from "./types.js";

export function createWebSocketService(httpServer: Server): WebSocketService {
  const wss = new WebSocketServer({ server: httpServer });
  const clients = new Set<WebSocket>();
  const userClients = new Map<string, Set<WebSocket>>();

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    // Extract user_id from query parameters
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      console.log("WebSocket connection rejected: missing user_id");
      ws.close(1008, "Missing user_id parameter");
      return;
    }

    console.log(`New WebSocket client connected for user_id: ${userId}`);
    clients.add(ws);

    // Add to user-specific client map
    if (!userClients.has(userId)) {
      userClients.set(userId, new Set());
    }
    userClients.get(userId)!.add(ws);

    ws.on("close", () => {
      console.log(`WebSocket client disconnected for user_id: ${userId}`);
      clients.delete(ws);

      // Remove from user-specific map
      const userSet = userClients.get(userId);
      if (userSet) {
        userSet.delete(ws);
        if (userSet.size === 0) {
          userClients.delete(userId);
        }
      }
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for user_id ${userId}:`, error);
      clients.delete(ws);

      // Remove from user-specific map
      const userSet = userClients.get(userId);
      if (userSet) {
        userSet.delete(ws);
        if (userSet.size === 0) {
          userClients.delete(userId);
        }
      }
    });
  });

  return {
    getClientCount(): number {
      return clients.size;
    },

    broadcast(message: unknown): void {
      const payload = JSON.stringify(message);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    },

    sendToUser(userId: string, message: unknown): boolean {
      const userSet = userClients.get(userId);
      if (!userSet || userSet.size === 0) {
        console.log(`No connected clients for user_id: ${userId}`);
        return false;
      }

      const payload = JSON.stringify(message);
      let sent = false;

      userSet.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
          sent = true;
        }
      });

      if (sent) {
        console.log(`Message sent to user_id: ${userId} (${userSet.size} client(s))`);
      }

      return sent;
    },

    addClient(ws: WebSocket): void {
      clients.add(ws);
    },

    removeClient(ws: WebSocket): void {
      clients.delete(ws);
    },
  };
}