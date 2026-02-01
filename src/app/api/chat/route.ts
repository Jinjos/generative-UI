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
import { ANALYST_SYSTEM_PROMPT } from "@/config/ai/analyst-prompt";
import { ANALYST_FEW_SHOT_EXAMPLES } from "@/config/ai/analyst-examples";
import { after } from "next/server";
import {
  observe,
  updateActiveObservation,
  updateActiveTrace,
} from "@langfuse/tracing";
import { trace } from "@opentelemetry/api";
import { langfuseSpanProcessor } from "@/instrumentation";
import { redisClient, getContextKey } from "@/lib/db/redis";
import { 
  MetricsService, 
} from "@/lib/services/metrics-service";
import type {
  CompareEntityConfig,
  SummaryResponse, 
  TrendResponse, 
  BreakdownResponse, 
  UserListResponse,
  BreakdownComparisonResponse,
  BreakdownStabilityResponse,
  UserChangeResponse,
  UserFirstActiveResponse,
  UserUsageRateResponse,
  BreakdownDimension,
  BreakdownMetricKey
} from "@/lib/types/metrics";
import { SnapshotService } from "@/lib/services/snapshot-service";
import { AnalysisService } from "@/lib/services/analysis-service";
import { resolveDatePlaceholders, startOfDayUTC } from "@/lib/utils/date-placeholders";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * Placeholder base URL used strictly for parsing relative paths with the URL constructor.
 * This ensures we can extract searchParams and pathnames from AI-generated strings safely.
 */
const PARSING_BASE_URL = "http://localhost";
const DEFAULT_MODEL_ID = "gpt-4o";

const getModelId = () => {
  const envModel = process.env.OPENAI_MODEL_ID?.trim();
  return envModel && envModel.length > 0 ? envModel : DEFAULT_MODEL_ID;
};

type SummaryMetricKey = "total_interactions" | "total_loc_added" | "acceptance_rate";
type TrendMetricKey = "interactions" | "loc_added" | "acceptance_rate" | "acceptances" | "suggestions";

interface CompareSummaryResponse {
  metric: SummaryMetricKey;
  gap: number;
  entityA: { label: string; value: number; isHigher: boolean };
  entityB: { label: string; value: number; isHigher: boolean };
}

const ALLOWED_BREAKDOWN_DIMENSIONS: BreakdownDimension[] = [
  "model",
  "ide",
  "feature",
  "language_model",
  "language_feature",
  "model_feature",
];

type SeriesPoint = Record<string, number | string>;
type MetricData =
  | SummaryResponse
  | SummaryResponse[]
  | TrendResponse[]
  | BreakdownResponse[]
  | UserListResponse[]
  | BreakdownComparisonResponse[]
  | BreakdownStabilityResponse[]
  | UserChangeResponse[]
  | UserFirstActiveResponse[]
  | UserUsageRateResponse
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

// --- Helper Functions for Data Fetching ---

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
  const model = typeof obj.model === "string" ? obj.model : undefined;
  const language = typeof obj.language === "string" ? obj.language : undefined;
  return {
    label,
    ...(segment ? { segment } : {}),
    ...(userLogin ? { userLogin } : {}),
    ...(model ? { model } : {}),
    ...(language ? { language } : {}),
  };
};

const getMetricKeysFromParams = (params: URLSearchParams) => {
  const trendMetricParam = params.get("metricKey");
  const summaryMetricParam = params.get("metricKey");
  const breakdownMetricParam = params.get("metricKey");

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
  
  const breakdownMetricKey: BreakdownMetricKey = (
    breakdownMetricParam === "interactions" ||
    breakdownMetricParam === "suggestions" ||
    breakdownMetricParam === "acceptances" ||
    breakdownMetricParam === "loc_suggested_to_add" ||
    breakdownMetricParam === "loc_suggested_to_delete" ||
    breakdownMetricParam === "loc_added" ||
    breakdownMetricParam === "loc_deleted" ||
    breakdownMetricParam === "acceptance_rate"
  ) ? breakdownMetricParam : "interactions";

  return { trendMetricKey, summaryMetricKey, breakdownMetricKey };
};

const normalizeBreakdownDimension = (value: string | null, allowDefault: boolean, warnings: string[]) => {
  if (!value) {
    return allowDefault ? "model" : null;
  }
  if (value === "team") {
    warnings.push("by=team is invalid; used by=feature instead.");
    return "feature";
  }
  if (ALLOWED_BREAKDOWN_DIMENSIONS.includes(value as BreakdownDimension)) {
    return value as BreakdownDimension;
  }
  warnings.push(`Invalid breakdown dimension '${value}'.`);
  return null;
};

// --- Route Handlers ---

type HandlerContext = {
  params: URLSearchParams;
  filters: {
    startDate?: Date;
    endDate?: Date;
    segment?: string;
    userLogin?: string;
    model?: string;
    language?: string;
  };
  metricKeys: ReturnType<typeof getMetricKeysFromParams>;
};

const routeHandlers: Record<string, (context: HandlerContext) => Promise<{ data: MetricData; summary: Record<string, unknown> }>> = {
  "/api/metrics/compare/summary": async ({ params, filters, metricKeys }) => {
    const entityA = toCompareEntity(parseJsonParam(params.get("entityA")));
    const entityB = toCompareEntity(parseJsonParam(params.get("entityB")));
    const { summaryMetricKey } = metricKeys;
    const { startDate, endDate } = filters;

    if (entityA && entityB) {
      const data = await MetricsService.getComparisonSummary(entityA, entityB, summaryMetricKey, { startDate, endDate });
      return { data, summary: data as unknown as Record<string, unknown> };
    } else {
      const data: CompareSummaryResponse = {
        metric: summaryMetricKey,
        gap: 0,
        entityA: { label: entityA?.label || "Entity A", value: 0, isHigher: false },
        entityB: { label: entityB?.label || "Entity B", value: 0, isHigher: false },
      };
      const summary = {
        ...data,
        error: "Invalid compare entities. Provide label and either segment or userLogin.",
      };
      return { data, summary };
    }
  },
  "/api/metrics/compare/trends": async ({ params, filters, metricKeys }) => {
    const parsedQueries = parseJsonParam(params.get("queries"));
    const entities = Array.isArray(parsedQueries)
      ? parsedQueries.map(toCompareEntity).filter((e): e is CompareEntityConfig => e !== null)
      : [];
    const { trendMetricKey } = metricKeys;
    const { startDate, endDate } = filters;
    
    const data = entities.length
      ? await MetricsService.getMultiSeriesTrends(entities, trendMetricKey, { startDate, endDate })
      : [];
    
    const summary = {
      series_count: entities.length,
      series_labels: entities.map((entity) => entity.label),
      data_points: data.length,
    };
    return { data: data as SeriesPoint[], summary };
  },
  "/api/metrics/breakdown/compare": async ({ params, filters, metricKeys }) => {
    const warnings: string[] = [];
    const byParam = normalizeBreakdownDimension(params.get("by"), false, warnings);
    const { breakdownMetricKey } = metricKeys;
    const compareStart = params.get("compareStart");
    const compareEnd = params.get("compareEnd");

    if (byParam && compareStart && compareEnd) {
      const compareFilters = { ...filters, startDate: new Date(compareStart), endDate: new Date(compareEnd) };
      const data = await MetricsService.getBreakdownComparison(byParam, breakdownMetricKey, filters, compareFilters);
      const summary = { metric: breakdownMetricKey, period_count: 2, ...(warnings.length > 0 && { warnings }) };
      return { data, summary };
    } else {
      const summary = {
        error: byParam ? "Missing breakdown comparison parameters" : "Invalid breakdown dimension",
        allowedDimensions: ALLOWED_BREAKDOWN_DIMENSIONS,
        ...(warnings.length > 0 && { warnings }),
      };
      return { data: [], summary };
    }
  },
  "/api/metrics/breakdown/stability": async ({ params, filters, metricKeys }) => {
    const warnings: string[] = [];
    const byParam = normalizeBreakdownDimension(params.get("by"), false, warnings);
    const { breakdownMetricKey } = metricKeys;

    if (byParam) {
      const data = await MetricsService.getBreakdownStability(byParam, breakdownMetricKey, filters);
      const summary = { metric: breakdownMetricKey, ...(warnings.length > 0 && { warnings }) };
      return { data, summary };
    } else {
      const summary = {
        error: "Missing or invalid breakdown stability parameters",
        allowedDimensions: ALLOWED_BREAKDOWN_DIMENSIONS,
        ...(warnings.length > 0 && { warnings }),
      };
      return { data: [], summary };
    }
  },
  "/api/metrics/users/change": async ({ params, filters, metricKeys }) => {
    const { breakdownMetricKey } = metricKeys;
    const compareStart = params.get("compareStart");
    const compareEnd = params.get("compareEnd");
    if (compareStart && compareEnd) {
      const compareFilters = { ...filters, startDate: new Date(compareStart), endDate: new Date(compareEnd) };
      const data = await MetricsService.getUserChange(breakdownMetricKey, filters, compareFilters);
      return { data, summary: { metric: breakdownMetricKey } };
    }
    return { data: [], summary: { error: "Missing user change parameters" } };
  },
  "/api/metrics/users/first-active": async ({ filters }) => {
    const data = await MetricsService.getUsersFirstActive(filters);
    return { data, summary: { total: data.length } };
  },
  "/api/metrics/users/usage-rate": async ({ filters }) => {
    const data = await MetricsService.getUsersUsageRates(filters);
    return { data, summary: data as unknown as Record<string, unknown> };
  },
  "/api/metrics/summary": async ({ filters }) => {
    const data = await MetricsService.getSummary(filters);
    return { data, summary: data as unknown as Record<string, unknown> };
  },
  "/api/metrics/trends": async ({ filters }) => {
    const data = await MetricsService.getDailyTrends(filters);
    const summary = {
      total_interactions_in_period: data.reduce((acc, curr) => acc + (curr.interactions || 0), 0),
      ...calculateTrendStats(data),
    };
    return { data, summary };
  },
  "/api/metrics/users": async ({ filters }) => {
    const data = await MetricsService.getUsersList(filters);
    const summary = {
      top_user: data[0]?.user_login || "None",
      top_user_interactions: data[0]?.interactions || 0,
      top_10_list: data.slice(0, 10).map(u => ({ name: u.user_login, value: u.interactions })),
      ...calculateDistributionStats(data),
    };
    return { data, summary };
  },
  "/api/metrics/breakdown": async ({ params, filters }) => {
    const warnings: string[] = [];
    const by = normalizeBreakdownDimension(params.get("by"), true, warnings);
    if (!by) {
      const summary = {
        error: "Invalid breakdown dimension",
        allowedDimensions: ALLOWED_BREAKDOWN_DIMENSIONS,
        ...(warnings.length > 0 && { warnings }),
      };
      return { data: [], summary };
    }
    const data = await MetricsService.getBreakdown(by, filters);
    const summary = {
      top_category: data[0]?.name,
      top_category_value: data[0]?.interactions,
      top_10_list: data.slice(0, 10).map(b => ({ name: b.name, value: b.interactions })),
      ...calculateDistributionStats(data),
      ...(warnings.length > 0 && { warnings }),
    };
    return { data, summary };
  }
};

async function fetchDataForEndpoint(endpoint: string): Promise<{ data: MetricData; summary: Record<string, unknown> }> {
  if (!endpoint) return { data: [], summary: {} };

  const baseDate = startOfDayUTC(new Date());
  const { endpoint: resolvedEndpoint, resolvedTokens, unresolvedTokens } =
    resolveDatePlaceholders(endpoint, baseDate);

  if (resolvedTokens.length > 0) {
    console.log(
      "🧭 [Server] Resolved date placeholders:",
      JSON.stringify({ tokens: resolvedTokens, endpoint: resolvedEndpoint })
    );
  }
  if (unresolvedTokens.length > 0) {
    console.warn(
      "⚠️ [Server] Unresolved placeholders in endpoint:",
      JSON.stringify({ tokens: unresolvedTokens, endpoint: resolvedEndpoint })
    );
  }

  const url = new URL(resolvedEndpoint, PARSING_BASE_URL);
  const params = url.searchParams;
  const path = url.pathname;
  
  console.log({ endpoint, resolvedEndpoint });

  // Find the correct handler in our map
  const handler = routeHandlers[path];
  if (!handler) {
    const summary = { error: `Invalid endpoint path: ${path}` };
    console.warn(`[Server] No handler found for path: ${path}`);
    return { data: [], summary };
  }

  // Prepare common parameters
  const rawStartDate = params.get("startDate") ?? params.get("start_date");
  const rawEndDate = params.get("endDate") ?? params.get("end_date");
  const startDate = rawStartDate ? new Date(rawStartDate) : undefined;
  const endDate = rawEndDate ? new Date(rawEndDate) : undefined;
  
  const filters = {
    startDate,
    endDate,
    segment: params.get("segment") || undefined,
    userLogin: params.get("userLogin") || undefined,
    model: params.get("model") || undefined,
    language: params.get("language") || undefined,
  };

  console.log(
    "🧭 [Server] fetchDataForEndpoint:",
    JSON.stringify({ path, resolvedEndpoint, filters })
  );
  
  const metricKeys = getMetricKeysFromParams(params);

  // Execute the handler
  return handler({ params, filters, metricKeys });
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

    const snapshotId = await SnapshotService.saveSnapshot(
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
 * Allows specific analysis by running code against freshly fetched data.
 */
const analyzeDataWithCodeTool = tool({
  description: "Analyze raw data from a new endpoint using JavaScript code. Use this for initial analysis or when no relevant snapshot is available.",
  inputSchema: z.object({
    endpoint: z.string().describe("The endpoint to fetch data from to analyze (e.g. /api/metrics/trends)"),
    code: z.string().describe("The JavaScript code to execute. Must return a value. Example: 'return data.filter(d => d.value > 10).length'"),
  }),
  execute: async ({ endpoint, code }) => {
    console.log("🧠 [Server] analyze_data_with_code triggered.");
    console.log("🧠 [Server] Endpoint:", endpoint);

    // 1. Fetch the Heavy Data (Server-side)
    const { data } = await fetchDataForEndpoint(endpoint);
    
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { error: "No data found at this endpoint." };
    }

    const sample = Array.isArray(data) ? data[0] : data;
    const sampleKeys =
      sample && typeof sample === "object"
        ? Object.keys(sample as Record<string, unknown>)
        : [];
    console.log("🧠 [Server] Data sample keys:", sampleKeys);

    if (Array.isArray(data)) {
      const interactionSamples = data.slice(0, 3).map((row) => {
        if (row && typeof row === "object" && "interactions" in row) {
          return (row as { interactions?: unknown }).interactions;
        }
        return undefined;
      });
      console.log("🧠 [Server] Data sample interactions:", interactionSamples);
    }

    // 2. Run Safe Analysis - Ensure data is always an array
    const dataArray = Array.isArray(data) ? data : [data];
    const result = await AnalysisService.runAnalysis(dataArray, code);
    
    console.log("🧠 [Server] Analysis Result:", JSON.stringify(result));
    return { result };
  },
});

/**
 * Tool 4: Snapshot Interpreter (The Agent's "Memory")
 * Allows the agent to perform follow-up analysis on data it has already fetched for a dashboard.
 */
const analyzeSnapshotTool = tool({
  description: "Analyze data from a previously created snapshot using JavaScript code. Use this for follow-up questions about a dashboard that is already being displayed, when a snapshotId is available in the conversation history.",
  inputSchema: z.object({
    snapshotId: z.string().describe("The ID of the snapshot to analyze."),
    code: z.string().describe("The JavaScript code to execute against the data in the snapshot. The data is available in a variable named 'data'. Example: 'return data.users.length'"),
  }),
  execute: async ({ snapshotId, code }) => {
    console.log("📸 [Server] analyze_snapshot triggered for:", snapshotId);
    
    const snapshot = await SnapshotService.getSnapshot(snapshotId);
    if (!snapshot || !snapshot.data) {
      return { error: `Snapshot with ID '${snapshotId}' not found or has no data.` };
    }
    
    // The data in the snapshot might be a composite object (for dashboards) or a direct array
    const dataForAnalysis = snapshot.data;
    
    console.log(`📸 [Server] Analyzing data of type: ${Array.isArray(dataForAnalysis) ? 'Array' : typeof dataForAnalysis}`);
    
    // Ensure data is always an array for the analysis service
    const dataArray = Array.isArray(dataForAnalysis) ? dataForAnalysis : [dataForAnalysis];
    const result = await AnalysisService.runAnalysis(dataArray, code);
    
    console.log("📸 [Server] Snapshot Analysis Result:", JSON.stringify(result));
    return { result };
  },
});

/**
 * Tool 5: Discovery (The Agent's "Compass")
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

/**
 * Tool 6: Context Awareness (The Agent's "Beacon")
 * Reads the user's current page context from Redis.
 */
const getCurrentPageViewTool = tool({
  description: "Get the current page URL and visible UI components. Use this to understand what the user is looking at.",
  inputSchema: z.object({}), 
  execute: async () => {
    return { error: "Context not injected" };
  },
});

const tools = {
  get_metrics_summary: getMetricsSummaryTool,
  render_dashboard: renderDashboardTool,
  analyze_data_with_code: analyzeDataWithCodeTool,
  analyze_snapshot: analyzeSnapshotTool,
  get_segments: getSegmentsTool,
  get_current_page_view: getCurrentPageViewTool,
} as const;

// Export the message type for the client to use
export type ChatUIMessage = UIMessage<never, UIDataTypes, InferUITools<typeof tools>>;

const handler = async (req: Request) => {
  console.log(`[Request Handler] Received new chat request at ${new Date().toISOString()}`);
  const { messages,
    chatId,
    userId,
    persona = "architect",
  }: { messages: ChatUIMessage[]; chatId?: string; userId?: string; persona?: "architect" | "analyst" } = await req.json();

  console.log(`[Request Handler] Chat ID: ${chatId}, User ID: ${userId}, Persona: ${persona}`);
  console.log(`[Request Handler] Message count: ${messages.length}`);

  // Create session-aware tools
  const sessionTools = {
    ...tools,
    get_current_page_view: tool({
      description: "Get the current page URL and visible UI components. Use this to understand what the user is looking at.",
      inputSchema: z.object({}),
      execute: async () => {
        console.log("👁️ [Server] getCurrentPageView triggered for:", chatId);
        if (!chatId) return { error: "No Chat ID found" };
        
        const key = getContextKey(chatId);
        const startedAt = Date.now();
        const contextStr = await redisClient.get(key);
        console.log(`👁️ [Server] getCurrentPageView redis ms: ${Date.now() - startedAt}`);
        
        if (!contextStr) {
          console.log("👁️ [Server] No context found for key:", key);
          return { page: "Unknown", error: "No active context found. The user might be on a page without a Beacon." };
        }
        
        const context = JSON.parse(contextStr);
        console.log("👁️ [Server] Context found:", context.page);
        return context;
      },
    }),
  };

  // Select Tools based on Persona
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { render_dashboard, ...analystTools } = sessionTools;
  const activeTools = persona === "analyst" ? analystTools : sessionTools;

  const now = new Date();
  const dateContext = `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
  console.log("🔍 [Server] Date Context injected into prompt:", dateContext);
  
  let systemPrompt = buildSystemPrompt(dateContext);
  
  if (persona === "analyst") {
    // Inject examples into the prompt for the analyst since it's not fine-tuned yet
    const examplesText = ANALYST_FEW_SHOT_EXAMPLES.map(ex => 
      `User: ${ex.user}\nAssistant: ${JSON.stringify(ex.tool_steps)}`
    ).join("\n\n");
    
    systemPrompt = `${ANALYST_SYSTEM_PROMPT}\n${dateContext}\n\n## EXAMPLES\n${examplesText}`;
  }

  const modelId = getModelId();
  console.log('MODEL ID', modelId)
  // Set session id and user id on active trace
  const inputText = messages[messages.length - 1]?.parts.find(
    (part) => part.type === "text"
  )?.text;
  console.log(`[Request Handler] User message: ${inputText || "N/A"}`);

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

  const requestStart = Date.now();
  let lastStepAt = requestStart;
  let stepIndex = 0;

  const convertStart = Date.now();
  const modelMessages = await convertToModelMessages(messages);
  console.log(`[Request Handler] convertToModelMessages ms: ${Date.now() - convertStart}`);

  // Use a type-safe approach to enable multi-step reasoning.
  const streamOptions = {
    model: openai(modelId),

    messages: modelMessages,
    system: systemPrompt,
    tools: activeTools,
    stopWhen: stepCountIs(5), // Crucial: Allows AI to see tool output and then write text
    experimental_telemetry: {
      isEnabled: true,
    },
    onStepFinish: (step: { toolCalls: unknown[]; usage: { totalTokens?: number } }) => {
      const now = Date.now();
      const stepMs = now - lastStepAt;
      const totalMs = now - requestStart;
      stepIndex += 1;
      const totalTokens = step.usage.totalTokens ?? 0;

      console.log(
        `[AI Step] #${stepIndex} finished in ${stepMs}ms (total ${totalMs}ms). ` +
        `toolCalls=${step.toolCalls.length}, tokens=${totalTokens}`
      );

      lastStepAt = now;
    },
    onFinish: (result: { text: string; toolCalls?: unknown[]; usage: Record<string, unknown> }) => {
      const totalMs = Date.now() - requestStart;
      console.log(`[AI Done] total ${totalMs}ms`);
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
