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
import { buildSystemPrompt } from "@/config/ai/system-prompt";
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
  CompareEntityConfig,
  SummaryResponse, 
  TrendResponse, 
  BreakdownResponse, 
  UserListResponse 
} from "@/lib/services/metrics-service";
import { SnapshotService } from "@/lib/services/snapshot-service";
import { AnalysisService } from "@/lib/services/analysis-service";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * Placeholder base URL used strictly for parsing relative paths with the URL constructor.
 * This ensures we can extract searchParams and pathnames from AI-generated strings safely.
 */
const PARSING_BASE_URL = "http://localhost";

type SummaryMetricKey = "total_interactions" | "total_loc_added" | "acceptance_rate";
type TrendMetricKey = "interactions" | "loc_added" | "acceptance_rate" | "acceptances" | "suggestions";

interface CompareSummaryResponse {
  metric: SummaryMetricKey;
  gap: number;
  entityA: { label: string; value: number; isHigher: boolean };
  entityB: { label: string; value: number; isHigher: boolean };
}

type SeriesPoint = Record<string, number | string>;
type MetricData =
  | SummaryResponse
  | SummaryResponse[]
  | TrendResponse[]
  | BreakdownResponse[]
  | UserListResponse[]
  | CompareSummaryResponse
  | SeriesPoint[];
type HeavyDataType = MetricData | Record<string, MetricData>;

/**
 * Calculates statistical descriptors for time-series data to give the Agent "eyes"
 * on the shape of the data without loading all data points.
 */
function calculateTrendStats(data: TrendResponse[]) {
  if (data.length === 0) return { trend: "no_data" };

  const values = data.map(d => d.interactions);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Find peak date
  const peakIndex = values.indexOf(max);
  const peakDate = data[peakIndex]?.date;

  // Simple trend direction (start vs end)
  const start = values[0];
  const end = values[values.length - 1];
  let direction = "flat";
  if (end > start * 1.1) direction = "up";
  else if (end < start * 0.9) direction = "down";

  return {
    trend_direction: direction,
    average_daily_interactions: Math.round(avg),
    peak_date: peakDate,
    peak_value: max,
    min_value: min,
    data_points: data.length,
    start_date: data[0].date,
    end_date: data[data.length - 1].date
  };
}

/**
 * Calculates distribution stats for categorical data (Users/Breakdowns).
 * Helps the Agent answer "Is the work balanced?" or "Who are the outliers?"
 */
function calculateDistributionStats(data: { interactions: number }[]) {
  if (data.length === 0) return { distribution: "no_data" };

  const values = data.map(d => d.interactions).sort((a, b) => a - b);
  const total = values.reduce((a, b) => a + b, 0);
  const avg = total / values.length;
  const min = values[0];
  const max = values[values.length - 1];
  
  // Median
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;

  return {
    total_population: values.length,
    average_interactions: Math.round(avg),
    median_interactions: Math.round(median),
    min_interactions: min,
    max_interactions: max,
    // Inequality indicator: High mean vs low median = top heavy
    is_balanced: median > avg * 0.8
  };
}

async function fetchDataForEndpoint(endpoint: string) {
  if (!endpoint) return { data: [], summary: {} };

  const url = new URL(endpoint, PARSING_BASE_URL);
  const params = url.searchParams;

  const dateFilters = {
    startDate: params.get("startDate") ? new Date(params.get("startDate")!) : undefined,
    endDate: params.get("endDate") ? new Date(params.get("endDate")!) : undefined,
  };

  const filters = {
    ...dateFilters,
    segment: params.get("segment") || undefined,
    userLogin: params.get("userLogin") || undefined,
  };

  const path = url.pathname;
  let data: MetricData = [];
  let summary: Record<string, unknown> = {};

  const parseJsonParam = (value: string | null): unknown => {
    if (!value) return null;
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  };

  const toCompareEntity = (value: unknown): CompareEntityConfig | null => {
    if (!value || typeof value !== "object") return null;
    const obj = value as Record<string, unknown>;
    const label = typeof obj.label === "string" ? obj.label : undefined;
    if (!label) return null;
    const segment = typeof obj.segment === "string" ? obj.segment : undefined;
    const userLogin = typeof obj.userLogin === "string" ? obj.userLogin : undefined;
    return {
      label,
      ...(segment ? { segment } : {}),
      ...(userLogin ? { userLogin } : {}),
    };
  };

  const trendMetricParam = params.get("metricKey");
  const summaryMetricParam = params.get("metricKey");
  const trendMetricKey: TrendMetricKey = (
    trendMetricParam === "interactions" ||
    trendMetricParam === "loc_added" ||
    trendMetricParam === "acceptance_rate" ||
    trendMetricParam === "acceptances" ||
    trendMetricParam === "suggestions"
  ) ? trendMetricParam : "interactions";
  const summaryMetricKey: SummaryMetricKey = (
    summaryMetricParam === "total_interactions" ||
    summaryMetricParam === "total_loc_added" ||
    summaryMetricParam === "acceptance_rate"
  ) ? summaryMetricParam : "total_interactions";

  if (path.includes("/compare/summary")) {
    const entityA = toCompareEntity(parseJsonParam(params.get("entityA")));
    const entityB = toCompareEntity(parseJsonParam(params.get("entityB")));

    if (entityA && entityB) {
      const comparison = await MetricsService.getComparisonSummary(entityA, entityB, summaryMetricKey, dateFilters);
      data = comparison;
      summary = comparison as unknown as Record<string, unknown>;
    } else {
      data = {
        metric: summaryMetricKey,
        gap: 0,
        entityA: { label: entityA?.label || "Entity A", value: 0, isHigher: false },
        entityB: { label: entityB?.label || "Entity B", value: 0, isHigher: false },
      };
      summary = data as CompareSummaryResponse as unknown as Record<string, unknown>;
    }
  } else if (path.includes("/compare/trends")) {
    const parsedQueries = parseJsonParam(params.get("queries"));
    const entities = Array.isArray(parsedQueries)
      ? parsedQueries
          .map((entry) => toCompareEntity(entry))
          .filter((entity): entity is CompareEntityConfig => entity !== null)
      : [];

    const seriesData = entities.length
      ? await MetricsService.getMultiSeriesTrends(entities, trendMetricKey, dateFilters)
      : [];

    data = seriesData as SeriesPoint[];
    summary = {
      series_count: entities.length,
      series_labels: entities.map((entity) => entity.label),
      data_points: seriesData.length,
    };
  } else if (path.includes("/summary")) {
    const res = await MetricsService.getSummary(filters);
    data = res; // Return object directly for KPIGrid compatibility
    summary = res as unknown as Record<string, unknown>;
  } else if (path.includes("/trends")) {
    const trendData = await MetricsService.getDailyTrends(filters);
    data = trendData;
    const trendStats = calculateTrendStats(trendData);
    const total = trendData.reduce((acc, curr) => acc + (curr.interactions || 0), 0);
    summary = { 
      total_interactions_in_period: total, 
      ...trendStats 
    };
  } else if (path.includes("/users")) {
    const users = await MetricsService.getUsersList(filters);
    data = users;
    const distStats = calculateDistributionStats(users);
    summary = { 
      top_user: users[0]?.user_login || "None", 
      top_user_interactions: users[0]?.interactions || 0,
      top_10_list: users.slice(0, 10).map(u => ({ name: u.user_login, value: u.interactions })),
      ...distStats
    };
  } else if (path.includes("/breakdown")) {
    const by = params.get("by") as "model" | "ide" || "model";
    const breakdown = await MetricsService.getBreakdown(by, filters);
    data = breakdown;
    const distStats = calculateDistributionStats(breakdown);
    summary = { 
      top_category: breakdown[0]?.name, 
      top_category_value: breakdown[0]?.interactions,
      top_10_list: breakdown.slice(0, 10).map(b => ({ name: b.name, value: b.interactions })),
      ...distStats
    };
  }

  return { data, summary };
}

/**
 * Helper: Parse the AI's generated "apiEndpoint" string to call the correct Service method.
 * The AI generates a URL-like string (e.g., "/api/metrics/trends?startDate=..."),
 * which we parse to extract parameters for the direct Service call.
 */
async function fetchDataForConfig(config: DashboardTool) {
  let heavyData: HeavyDataType = [];
  let summary: Record<string, unknown> = {};

  if (config.layout === "dashboard") {
    // Parallel fetch for all slots
    const [main, rightTop, rightBottom] = await Promise.all([
      fetchDataForEndpoint(config.slotMain.apiEndpoint),
      config.slotRightTop ? fetchDataForEndpoint(config.slotRightTop.apiEndpoint) : Promise.resolve({ data: [], summary: {} }),
      config.slotRightBottom ? fetchDataForEndpoint(config.slotRightBottom.apiEndpoint) : Promise.resolve({ data: [], summary: {} }),
    ]);

    // Construct Composite Snapshot
    heavyData = {
      slotMain: main.data,
      slotRightTop: rightTop.data,
      slotRightBottom: rightBottom.data
    };

    // Merge summaries (Last write wins, but usually they are distinct enough or we just care about Main)
    summary = { ...main.summary, ...rightTop.summary, ...rightBottom.summary };

  } else {
    // Single or Split (Legacy/Simple logic)
    if (config.layout === "single") {
      const result = await fetchDataForEndpoint(config.config.apiEndpoint);
      heavyData = result.data;
      summary = result.summary;
    } else if (config.layout === "split") {
      const [leftResult, rightResult] = await Promise.all([
        fetchDataForEndpoint(config.leftChart.apiEndpoint),
        fetchDataForEndpoint(config.rightChart.apiEndpoint),
      ]);

      heavyData = {
        leftChart: leftResult.data,
        rightChart: rightResult.data,
      };
      summary = { ...leftResult.summary, ...rightResult.summary };
    }
  }

  // If dashboard has headerStats, fetch that summary explicitly if not already done
  if (config.layout === "dashboard" && config.headerStats) {
    // Just use the main summary for header stats if available, or fetch specific if needed
    // For now, we assume header stats come from the general summary
    const url = new URL(config.slotMain.apiEndpoint, PARSING_BASE_URL);
    const params = url.searchParams;
    const filters = {
       startDate: params.get("startDate") ? new Date(params.get("startDate")!) : undefined,
       endDate: params.get("endDate") ? new Date(params.get("endDate")!) : undefined,
    };
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

/**
 * Tool 3: Code Interpreter (The Agent's "Brain")
 * Allows specific analysis by running code against the heavy data.
 */
const analyzeDataWithCodeTool = tool({
  description: "Analyze the raw data using JavaScript code. Use this when the summary is insufficient. You have access to a 'data' variable containing the array.",
  inputSchema: z.object({
    endpoint: z.string().describe("The endpoint to fetch data from to analyze (e.g. /api/metrics/trends)"),
    code: z.string().describe("The JavaScript code to execute. Must return a value. Example: 'return data.filter(d => d.value > 10).length'"),
  }),
  execute: async ({ endpoint, code }) => {
    console.log("🧠 [Server] analyze_data_with_code triggered.");
    console.log("🧠 [Server] Endpoint:", endpoint);

    // 1. Fetch the Heavy Data (Server-side)
    // We reuse the existing logic, just grabbing the data array
    const { data } = await fetchDataForEndpoint(endpoint);
    
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { error: "No data found at this endpoint." };
    }

    // 2. Run Safe Analysis
    // We expect 'data' to be an array for most analysis tasks
    const dataArray = Array.isArray(data) ? data : [data];
    const result = await AnalysisService.runAnalysis(dataArray, code);
    
    console.log("🧠 [Server] Analysis Result:", JSON.stringify(result));
    return { result };
  },
});

/**
 * Tool 4: Discovery (The Agent's "Compass")
 * Finds valid teams/segments to filter by.
 */
const getSegmentsTool = tool({
  description: "Get a list of all available teams/segments in the database. Use this if the user asks for a list of teams or if you are unsure which segment name to use.",
  inputSchema: z.object({}),
  execute: async () => {
    console.log("🧭 [Server] get_segments triggered.");
    const segments = await MetricsService.getSegments();
    console.log("🧭 [Server] Segments found:", segments.length);
    return { segments };
  },
});

const tools = {
  get_metrics_summary: getMetricsSummaryTool,
  render_dashboard: renderDashboardTool,
  analyze_data_with_code: analyzeDataWithCodeTool,
  get_segments: getSegmentsTool,
} as const;

// Export the message type for the client to use
export type ChatUIMessage = UIMessage<never, UIDataTypes, InferUITools<typeof tools>>;

const handler = async (req: Request) => {
  console.log(`[Request Handler] Received new chat request at ${new Date().toISOString()}`);
  const { messages,
    chatId,
    userId,
  }: { messages: ChatUIMessage[]; chatId?: string; userId?: string } = await req.json();

  console.log(`[Request Handler] Chat ID: ${chatId}, User ID: ${userId}`);
  console.log(`[Request Handler] Message count: ${messages.length}`);

  const now = new Date();
  const dateContext = `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
  console.log("🔍 [Server] Date Context injected into prompt:", dateContext);
  const systemPrompt = `${buildSystemPrompt()}\n\n${dateContext}`;

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
    system: systemPrompt,
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
      // Log the full error object for comprehensive debugging
      console.error("[AI Error] Full error object:", JSON.stringify(error, null, 2));

      // Define minimal types for the AI SDK errors to avoid 'any'
      interface AIRetryErrorType extends Error {
        name: 'AI_RetryError';
        reason: string;
        lastError?: AIAPICallErrorType;
      }

      interface AIAPICallErrorType extends Error {
        name: 'AI_APICallError';
        url: string;
        requestBodyValues?: {
          model?: string;
        };
        statusCode?: number;
        responseBody?: string;
      }

      // Attempt to extract specific details if it's an AI_RetryError
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as AIRetryErrorType).name === 'AI_RetryError'
      ) {
        const aiRetryError = error as AIRetryErrorType;
        console.error(`[AI_RetryError] Max retries exceeded. Reason: ${aiRetryError.reason}`);
        if (aiRetryError.lastError) {
          const lastError = aiRetryError.lastError;
          console.error(`  [AI_APICallError] Last attempt failed.`);
          console.error(`    URL: ${lastError.url}`);
          console.error(`    Request Body (model): ${lastError.requestBodyValues?.model}`);
          console.error(`    Response Status: ${lastError.statusCode}`);
          if (lastError.responseBody) {
            try {
              const responseBody = JSON.parse(lastError.responseBody);
              console.error(`    Response Message: ${responseBody.message || lastError.responseBody}`);
            } catch { // parseError is not used
              console.error(`    Raw Response Body: ${lastError.responseBody}`);
            }
          }
        }
      } else if (error instanceof Error) {
        console.error(`[AI Error] ${error.name}: ${error.message}`);
      } else {
        console.error("[AI Error] Unknown error type:", error);
      }

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
