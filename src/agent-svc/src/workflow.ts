import { StateGraph, Annotation } from "@langchain/langgraph";
import { DaprClient, ActorId } from "@dapr/dapr";
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

// Node: Analyze the actor state and answer the question
async function analyzeAndAnswer(state: typeof WorkflowState.State) {
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

  // Simple analysis: convert state to string and provide summary
  const stateKeys = Object.keys(state.actorState);
  const stateValues = Object.values(state.actorState);

  let answer = `Actor ${state.actorId} state analysis:\n`;
  answer += `- Number of fields: ${stateKeys.length}\n`;
  answer += `- Fields: ${stateKeys.join(", ")}\n`;
  answer += `- State data: ${JSON.stringify(state.actorState, null, 2)}\n`;

  // Try to answer the specific question based on state
  const questionLower = state.question.toLowerCase();
  if (questionLower.includes("status") || questionLower.includes("state")) {
    answer += `\nAnswer to "${state.question}": The current state contains ${stateKeys.length} properties.`;
  } else if (questionLower.includes("value") || questionLower.includes("data")) {
    answer += `\nAnswer to "${state.question}": ${JSON.stringify(state.actorState)}`;
  } else {
    answer += `\nAnswer to "${state.question}": State information provided above.`;
  }

  return {
    answer,
    reasoning: [
      ...state.reasoning,
      `Analyzed ${stateKeys.length} state properties`,
      "Generated answer based on actor state",
    ],
  };
}

// Create the workflow graph
export function createAgentWorkflow(daprClient: DaprClient, actorType: string) {
  const workflow = new StateGraph(WorkflowState)
    .addNode("fetchState", (state) => fetchActorState(state, daprClient, actorType))
    .addNode("analyze", analyzeAndAnswer)
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
