import { StateGraph, Annotation } from "@langchain/langgraph";
import { DaprClient, ActorId } from "@dapr/dapr";
import { ChatOpenAI } from "@langchain/openai";
import type { ActorStateData } from "./types.js";

// Define a simple actor interface
class StateActor {
  async getState(): Promise<ActorStateData> {
    return {};
  }
}

// Define the state annotation for our workflow
const WorkflowState = Annotation.Root({
  actorId: Annotation<string>,
  question: Annotation<string>,
  actorState: Annotation<ActorStateData | null>,
  answer: Annotation<string>,
  reasoning: Annotation<string[]>,
  error: Annotation<string | null>,
});

// Node: Fetch actor state from Dapr
async function fetchActorState(
  state: typeof WorkflowState.State,
  daprClient: DaprClient,
  actorType: string
) {
  console.log(`Fetching state for actor: ${state.actorId}`);

  try {
    // Use Dapr actor proxy to invoke actor method
    const actorProxy = daprClient.actor.create(StateActor);
    const actorState = await actorProxy.getState();

    return {
      actorState: actorState,
      reasoning: [...state.reasoning, `Fetched state for actor ${state.actorId}`],
    };
  } catch (error) {
    console.error("Error fetching actor state:", error);
    return {
      actorState: null,
      error: `Failed to fetch actor state: ${error}`,
      reasoning: [...state.reasoning, `Failed to fetch state: ${error}`],
    };
  }
}

// Node: Analyze the actor state and answer the question using LLM
async function analyzeAndAnswer(
  state: typeof WorkflowState.State,
  llm: ChatOpenAI
) {
  console.log(`Analyzing state and answering question: ${state.question}`);

  if (state.error) {
    return {
      answer: `Unable to answer due to error: ${state.error}`,
      reasoning: [...state.reasoning, "Analysis aborted due to previous error"],
    };
  }

  if (!state.actorState) {
    return {
      answer: "No actor state available to analyze",
      reasoning: [...state.reasoning, "No state data to analyze"],
    };
  }

  // Prepare prompt for LLM
  const prompt = `You are an AI assistant analyzing actor state data. The user has asked a question about an actor's state.

Actor ID: ${state.actorId}
Actor State: ${JSON.stringify(state.actorState, null, 2)}

User Question: ${state.question}

Please analyze the actor state and provide a clear, concise answer to the user's question. Focus on the relevant information from the state data that helps answer the question.`;

  try {
    // Use LLM to analyze and answer
    const response = await llm.invoke(prompt);
    const answer = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    return {
      answer,
      reasoning: [
        ...state.reasoning,
        `Used LLM to analyze ${Object.keys(state.actorState).length} state properties`,
        "Generated answer using AI analysis",
      ],
    };
  } catch (error) {
    console.error("LLM analysis failed:", error);
    // Fallback to simple analysis
    const stateKeys = Object.keys(state.actorState);
    const fallbackAnswer = `Actor ${state.actorId} state has ${stateKeys.length} properties: ${stateKeys.join(", ")}. State data: ${JSON.stringify(state.actorState, null, 2)}`;

    return {
      answer: fallbackAnswer,
      reasoning: [
        ...state.reasoning,
        "LLM analysis failed, used fallback method",
      ],
    };
  }
}

// Create the workflow graph
export function createAgentWorkflow(
  daprClient: DaprClient,
  actorType: string,
  llmConfig: { litellmUrl: string; anthropicApiKey: string }
) {
  // Create LLM instance configured for LiteLLM
  const llm = new ChatOpenAI({
    modelName: "claude-3-5-sonnet-20241022",
    temperature: 0.7,
    openAIApiKey: llmConfig.anthropicApiKey,
    configuration: {
      baseURL: llmConfig.litellmUrl,
    },
  });

  const workflow = new StateGraph(WorkflowState)
    .addNode("fetchState", (state) => fetchActorState(state, daprClient, actorType))
    .addNode("analyze", (state) => analyzeAndAnswer(state, llm))
    .addEdge("__start__", "fetchState")
    .addEdge("fetchState", "analyze")
    .addEdge("analyze", "__end__");

  return workflow.compile();
}

// Execute workflow helper
export async function executeWorkflow(
  workflow: ReturnType<typeof createAgentWorkflow>,
  actorId: string,
  question: string
) {
  const initialState = {
    actorId,
    question,
    actorState: null,
    answer: "",
    reasoning: ["Workflow started"],
    error: null,
  };

  const result = await workflow.invoke(initialState);

  return {
    answer: result.answer,
    actorState: result.actorState,
    reasoning: result.reasoning,
  };
}
