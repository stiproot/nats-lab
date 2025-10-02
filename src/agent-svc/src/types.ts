export interface AgentQueryRequest {
  actorId: string;
  question: string;
}

export interface AgentQueryResponse {
  answer: string;
  actorState: unknown;
  reasoning?: string[];
}

export interface ActorStateData {
  [key: string]: unknown;
}
