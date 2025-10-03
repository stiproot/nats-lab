export interface CloudEvent {
  id: string;
  source: string;
  type: string;
  datacontenttype?: string;
  data: unknown;
  [key: string]: unknown;
}

export interface MessageHandler {
  (data: unknown): void | Promise<void>;
}

export interface DaprService {
  start(): Promise<void>;
  stop(): Promise<void>;
  subscribe(handler: MessageHandler): void;
}
