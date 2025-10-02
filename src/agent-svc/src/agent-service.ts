import { Effect, Context, Layer } from "effect";
import { DaprClient } from "@dapr/dapr";
import { createAgentWorkflow, executeWorkflow } from "./workflow.js";
import type { AgentQueryRequest, AgentQueryResponse } from "./types.js";

// Define the DaprService as a service tag for Effect
export class DaprService extends Context.Tag("DaprService")<
  DaprService,
  {
    readonly client: DaprClient;
    readonly actorType: string;
  }
>() {}

// Define the WorkflowService
export class WorkflowService extends Context.Tag("WorkflowService")<
  WorkflowService,
  {
    readonly workflow: ReturnType<typeof createAgentWorkflow>;
  }
>() {}

// Effect program to query an actor through the LangGraph workflow
export const queryActorWithWorkflow = (
  request: AgentQueryRequest
): Effect.Effect<AgentQueryResponse, Error, WorkflowService> =>
  Effect.gen(function* () {
    // Get the workflow service from context
    const workflowService = yield* WorkflowService;

    console.log(`[Effect] Querying actor: ${request.actorId}`);
    console.log(`[Effect] Question: ${request.question}`);

    try {
      // Execute the LangGraph workflow
      const result = yield* Effect.tryPromise({
        try: () =>
          executeWorkflow(
            workflowService.workflow,
            request.actorId,
            request.question
          ),
        catch: (error) => new Error(`Workflow execution failed: ${error}`),
      });

      console.log(`[Effect] Workflow completed successfully`);

      return {
        answer: result.answer,
        actorState: result.actorState,
        reasoning: result.reasoning,
      };
    } catch (error) {
      console.error(`[Effect] Workflow error:`, error);
      throw error;
    }
  });

// Create the DaprService layer
export const makeDaprServiceLayer = (daprHost: string, daprPort: string, actorType: string) =>
  Layer.succeed(
    DaprService,
    DaprService.of({
      client: new DaprClient({ daprHost, daprPort }),
      actorType,
    })
  );

// Create the WorkflowService layer
export const makeWorkflowServiceLayer = Layer.effect(
  WorkflowService,
  Effect.gen(function* () {
    const daprService = yield* DaprService;
    const workflow = createAgentWorkflow(daprService.client, daprService.actorType);
    console.log(`[Effect] WorkflowService initialized`);
    return { workflow };
  })
);

// Helper to run the Effect program with proper error handling
export const runQueryActorEffect = (
  request: AgentQueryRequest,
  daprHost: string,
  daprPort: string,
  actorType: string
): Promise<AgentQueryResponse> => {
  const daprLayer = makeDaprServiceLayer(daprHost, daprPort, actorType);
  const workflowLayer = makeWorkflowServiceLayer;

  const program = queryActorWithWorkflow(request);

  const mainLayer = Layer.provide(workflowLayer, daprLayer);

  return Effect.runPromise(Effect.provide(program, mainLayer));
};
