/**
 * ARCHITECTURE NOTE: THE ORCHESTRATION LAYER
 * 
 * This route serves as the "Brain" of the GenUI Engine. 
 * It implements a specialized two-step tool-calling pattern designed for token efficiency:
 * 
 * 1. STEP 1 (The Eyes): The Agent calls 'get_metrics_summary' to fetch a tiny statistical 
 *    overview of the data. This allows the LLM to "see" the facts without loading 
 *    thousands of raw database rows into its context window.
 * 
 * 2. STEP 2 (The Hands): The Agent calls 'render_dashboard' to dictate the UI Layout.
 *    Instead of sending data back to the client via the LLM, we generate a "Snapshot" 
 *    on the server and send only the Snapshot ID to the UI.
 * 
 * This decoupling ensures that we can visualize massive datasets (e.g., 1-year history)
 * while keeping the LLM response fast, cheap, and precise.
 */

import { openai } from "@ai-sdk/openai";
import {
  stepCountIs,
  streamText,
  tool,
  InferUITools,
  UIMessage,
  UIDataTypes,
  convertToModelMessages
} from "ai";
import { z } from "zod";
import { DashboardToolSchema, DashboardTool } from "@/lib/genui/schemas";
import { injectSnapshotIntoConfig } from "@/lib/genui/utils";
import { SYSTEM_PROMPT } from "@/config/ai/system-prompt";
import { after } from "next/server";
import {
  observe,
  updateActiveObservation,
  updateActiveTrace,
} from "@langfuse/tracing";
import { trace } from "@opentelemetry/api";
import { langfuseSpanProcessor } from "@/instrumentation";
import { 
  MetricsService, 
  SummaryResponse, 
  TrendResponse, 
  BreakdownResponse, 
  UserListResponse 
} from "@/lib/services/metrics-service";
import { SnapshotService } from "@/lib/services/snapshot-service";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

type HeavyDataType = SummaryResponse | TrendResponse[] | BreakdownResponse[] | UserListResponse[];

/**
 * Helper: Parse the AI's generated "apiEndpoint" string to call the correct Service method.
 * The AI generates a URL-like string (e.g., "/api/metrics/trends?startDate=..."),
 * which we parse to extract parameters for the direct Service call.
 */
async function fetchDataForConfig(config: DashboardTool) {
  // Extract the main component to decide which data to fetch
  // In a 'dashboard' layout, we usually fetch the main slot's data
  // For 'split', we might fetch both, but for this prototype, we target the first valid endpoint found.
  
  let targetEndpoint = "";
  if (config.layout === "dashboard") {
    targetEndpoint = config.slotMain.apiEndpoint;
  } else if (config.layout === "single") {
    targetEndpoint = config.config.apiEndpoint;
  } else if (config.layout === "split") {
    targetEndpoint = config.leftChart.apiEndpoint;
  }

  if (!targetEndpoint) return { data: [], summary: {} };

  // Parse Query Params
  const url = new URL(targetEndpoint, "http://dummy.com");
  const params = url.searchParams;
  
  const filters = {
    startDate: params.get("startDate") ? new Date(params.get("startDate")!) : undefined,
    endDate: params.get("endDate") ? new Date(params.get("endDate")!) : undefined,
    segment: params.get("segment") || undefined,
    userLogin: params.get("userLogin") || undefined,
  };

  const path = url.pathname;
  let heavyData: HeavyDataType = [];
  let summary: Record<string, unknown> = {};

  // Map Endpoint to Service Method
  if (path.includes("/summary")) {
    const data = await MetricsService.getSummary(filters);
    heavyData = data;
    summary = data as unknown as Record<string, unknown>; // SummaryResponse is compatible object
  } else if (path.includes("/trends")) {
    const trendData = await MetricsService.getDailyTrends(filters);
    heavyData = trendData;
    // Auto-generate a simple summary for trends
    const total = trendData.reduce((acc, curr) => acc + (curr.interactions || 0), 0);
    summary = { total_interactions_in_period: total, days_with_data: trendData.length };
  } else if (path.includes("/users")) {
    const users = await MetricsService.getUsersList(filters);
    heavyData = users;
    summary = { 
      top_user: users[0]?.user_login || "None", 
      top_user_interactions: users[0]?.interactions || 0 
    };
  } else if (path.includes("/breakdown")) {
    const by = params.get("by") as "model" | "ide" || "model";
    const breakdown = await MetricsService.getBreakdown(by, filters);
    heavyData = breakdown;
    summary = { top_category: breakdown[0]?.name, top_category_value: breakdown[0]?.interactions };
  }

  // If dashboard has headerStats, fetch that summary explicitly if not already done
  if (config.layout === "dashboard" && config.headerStats) {
    const headerSummary = await MetricsService.getSummary(filters);
    summary = { ...summary, ...headerSummary };
  }

  return { heavyData, summary };
}

/**
 * Tool 1: Data Retriever (The Agent's "Eyes")
 * Strictly fetches data summary for reasoning.
 */
const getMetricsSummaryTool = tool({
  description: "Fetch a summary of metrics for analysis. Use this BEFORE rendering a dashboard to understand the data.",
  inputSchema: z.object({
    endpoint: z.string().describe("The endpoint to fetch from, e.g., /api/metrics/summary?segment=Backend"),
  }),
  execute: async ({ endpoint }) => {
    console.log("🔍 [Server] get_metrics_summary triggered for:", endpoint);
    
    // Construct dummy config to reuse fetchData logic
    const dummyConfig: DashboardTool = {
      layout: "single",
      config: {
        component: "KPIGrid",
        apiEndpoint: endpoint,
        title: "Summary Fetch"
      }
    };

    const { summary } = await fetchDataForConfig(dummyConfig);
    console.log("🔍 [Server] get_metrics_summary Result:", JSON.stringify(summary, null, 2));
    return summary;
  },
});

/**
 * Tool 2: UI Orchestrator (The Agent's "Hands")
 * Renders the dashboard using a pre-calculated snapshot ID if possible, or direct endpoint.
 */
const renderDashboardTool = tool({
  description: "Render a dashboard UI. Call this AFTER you have analyzed the data summary.",
  inputSchema: z.object({
    config: DashboardToolSchema,
  }),
  execute: async ({ config }) => {
    console.log("🛠️ [Server] render_dashboard triggered.");
    console.log("🛠️ [Server] Config Received:", JSON.stringify(config, null, 2));
    
    // Fetch and Snapshot
    const { heavyData, summary } = await fetchDataForConfig(config);
    console.log(`🛠️ [Server] Hydrated Heavy Data Type: ${Array.isArray(heavyData) ? 'Array' : typeof heavyData}`);
    console.log(`🛠️ [Server] Heavy Data Length: ${Array.isArray(heavyData) ? heavyData.length : 'N/A'}`);

    const snapshotId = SnapshotService.saveSnapshot(
      (heavyData || []) as Record<string, unknown> | unknown[], 
      summary, 
      config
    );
    const hydratedConfig = injectSnapshotIntoConfig(config, snapshotId);

    return {
      config: hydratedConfig,
      snapshotId,
      summary
    };
  },
});

const tools = {
  get_metrics_summary: getMetricsSummaryTool,
  render_dashboard: renderDashboardTool,
} as const;

// Export the message type for the client to use
export type ChatUIMessage = UIMessage<never, UIDataTypes, InferUITools<typeof tools>>;

const handler = async (req: Request) => {
  const { messages,
    chatId,
    userId,
  }: { messages: ChatUIMessage[]; chatId?: string; userId?: string } = await req.json();

  const now = new Date();
  const dateContext = `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
  console.log("🔍 [Server] Date Context injected into prompt:", dateContext);

  // Set session id and user id on active trace
  const inputText = messages[messages.length - 1]?.parts.find(
    (part) => part.type === "text"
  )?.text;

  // Add session and user context to the trace
  updateActiveObservation({
    input: inputText,
  });

  updateActiveTrace({
    name: "chat-message",
    sessionId: chatId,  // Groups related messages together
    userId,             // Track which user made the request
    input: inputText,
  });

  // Use a type-safe approach to enable multi-step reasoning.
  const streamOptions = {
    model: openai("gpt-4o"),
    messages: await convertToModelMessages(messages),
    system: `${SYSTEM_PROMPT}\n\n${dateContext}`,
    tools,
    stopWhen: stepCountIs(5), // Crucial: Allows AI to see tool output and then write text
    experimental_telemetry: {
      isEnabled: true,
    },
    onFinish: (result: { text: string; toolCalls?: unknown[]; usage: Record<string, unknown> }) => {
      const { text, toolCalls, usage } = result;
      // Update trace with final output after stream completes
      updateActiveObservation({
        output: text,
      });
      updateActiveTrace({
        output: text,
      });

      console.log("=== AI DECISION TRACE ===");
      console.log("Status: Stream Finished");
      console.log("Usage:", usage);
      if (toolCalls && toolCalls.length > 0) {
        console.log("Tool Decision:", JSON.stringify(toolCalls, null, 2));
      } else {
        console.log("Response Text:", text);
      }
      console.log("=========================");

      // End span manually after stream has finished
      trace.getActiveSpan()?.end();
    },
    onError: ({ error }: { error: unknown }) => {
      updateActiveObservation({
        output: error,
        level: "ERROR"
      });
      updateActiveTrace({
        output: error,
      });

      // Manually end the span since we're streaming
      trace.getActiveSpan()?.end();
    },
  };

  const result = streamText(streamOptions);

  // Critical for serverless: flush traces before function terminates
  after(async () => await langfuseSpanProcessor.forceFlush());

  return result.toUIMessageStreamResponse();
};

// Wrap handler with observe() to create a Langfuse trace
export const POST = observe(handler, {
  name: "handle-chat-message",
  endOnExit: false, // Don't end observation until stream finishes
});
