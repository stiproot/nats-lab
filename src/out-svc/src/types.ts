import type { WebSocket } from "ws";

export interface MessageHandler {
  (data: unknown): void;
}

export interface NATSMessage {
  user_id: string;
  [key: string]: unknown;
}

export interface WebSocketService {
  getClientCount(): number;
  broadcast(message: unknown): void;
  sendToUser(userId: string, message: unknown): boolean;
  addClient(ws: WebSocket): void;
  removeClient(ws: WebSocket): void;
}

export interface DaprService {
  start(): Promise<void>;
  stop(): Promise<void>;
  subscribe(handler: MessageHandler): void;
}