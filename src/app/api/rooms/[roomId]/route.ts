import { openai } from "@ai-sdk/openai";
import {
  stepCountIs,
  streamText,
  tool,
} from "ai";
import { z } from "zod";
import { DashboardToolSchema, DashboardTool } from "@/lib/genui/schemas";
import { injectSnapshotIntoConfig } from "@/lib/genui/utils";
import { SYSTEM_PROMPT } from "@/config/ai/system-prompt";
import {
  MetricsService, 
  SummaryResponse, 
  TrendResponse, 
  BreakdownResponse, 
  UserListResponse 
} from "@/lib/services/metrics-service";
import { SnapshotService } from "@/lib/services/snapshot-service";
import { RoomService } from "@/lib/services/room-service";
import { NextRequest, NextResponse } from "next/server";

// --- Tool Definitions (Cloned for Isolation) ---

type HeavyDataType = SummaryResponse | TrendResponse[] | BreakdownResponse[] | UserListResponse[];

async function fetchDataForConfig(config: DashboardTool) {
  let targetEndpoint = "";
  if (config.layout === "dashboard") {
    targetEndpoint = config.slotMain.apiEndpoint;
  } else if (config.layout === "single") {
    targetEndpoint = config.config.apiEndpoint;
  } else if (config.layout === "split") {
    targetEndpoint = config.leftChart.apiEndpoint;
  }

  if (!targetEndpoint) return { data: [], summary: {} };

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

  if (path.includes("/summary")) {
    const data = await MetricsService.getSummary(filters);
    heavyData = data;
    summary = data as unknown as Record<string, unknown>;
  } else if (path.includes("/trends")) {
    const trendData = await MetricsService.getDailyTrends(filters);
    heavyData = trendData;
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

  if (config.layout === "dashboard" && config.headerStats) {
    const headerSummary = await MetricsService.getSummary(filters);
    summary = { ...summary, ...headerSummary };
  }

  return { heavyData, summary };
}

const getMetricsSummaryTool = tool({
  description: "Fetch a summary of metrics for analysis.",
  inputSchema: z.object({
    endpoint: z.string(),
  }),
  execute: async ({ endpoint }) => {
    const dummyConfig: DashboardTool = {
      layout: "single",
      config: { component: "KPIGrid", apiEndpoint: endpoint, title: "Summary" }
    };
    const { summary } = await fetchDataForConfig(dummyConfig);
    return summary;
  },
});

const renderDashboardTool = tool({
  description: "Render a dashboard UI.",
  inputSchema: z.object({
    config: DashboardToolSchema,
  }),
  execute: async ({ config }) => {
    const { heavyData, summary } = await fetchDataForConfig(config);
    const snapshotId = SnapshotService.saveSnapshot(
      (heavyData || []) as Record<string, unknown> | unknown[], 
      summary, 
      config
    );
    return {
      config: injectSnapshotIntoConfig(config, snapshotId),
      snapshotId,
      summary
    };
  },
});

const tools = {
  get_metrics_summary: getMetricsSummaryTool,
  render_dashboard: renderDashboardTool,
} as const;

// --- API Handlers ---

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> } 
) {
  const { roomId } = await params;
  const room = await RoomService.getOrCreateRoom(roomId);
  return NextResponse.json(room);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> } 
) {
  const { roomId } = await params;
  const { messages } = await request.json(); // We expect the client to send the NEW message(s) or we assume logic

  // Wait, standard Vercel useChat sends the WHOLE history.
  // In our Hybrid approach, we want to SUPPORT that but ALSO persist it.
  // OR, we can just take the *last* message if we trust the server history.
  // Let's assume we receive the full history from useChat for compatibility, 
  // BUT we should verify if we want to trust the client or the DB.
  
  // STRATEGY:
  // 1. Get the *last* user message from the request.
  // 2. Append it to the DB history.
  // 3. Re-fetch full DB history.
  // 4. Use DB history for AI generation. 
  
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user') {
    return NextResponse.json({ error: "Last message must be from user" }, { status: 400 });
  }

  // 1. Persist User Message
  await RoomService.addMessage(roomId, {
    role: 'user',
    content: lastMessage.content,
    createdAt: new Date()
  });

  // 2. Fetch Full History from DB
  const room = await RoomService.getOrCreateRoom(roomId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbHistory = room.messages as any[]; 
  // Note: room.messages is just an array of objects, convertToModelMessages might need clean input.
  // We'll trust that DB format matches CoreMessage roughly or map it.

  // 3. Run AI
  const result = streamText({
    model: openai("gpt-4o"),
    messages: dbHistory, // Use SERVER state, not Client state
    system: `${SYSTEM_PROMPT}\n\nToday is ${new Date().toLocaleDateString()}`,
    tools,
    stopWhen: stepCountIs(5),
    onFinish: async (result) => {
      // 4. Persist AI Response
      // We need to store the text AND any tool invocations
      await RoomService.addMessage(roomId, {
        role: 'assistant',
        content: result.text,
        toolCalls: result.toolCalls,
        createdAt: new Date()
      });

      // 5. Update Room Config if render_dashboard was called
      const renderCall = result.toolCalls.find(tc => tc.toolName === 'render_dashboard');
      if (renderCall) {
        // The args are typed as any in the result, but we know the shape from our tool
        const toolResult = result.toolResults.find(tr => tr.toolCallId === renderCall.toolCallId);
        if (toolResult) {
             // toolResult.result contains { config, snapshotId, summary }
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             await RoomService.updateRoom(roomId, { config: (toolResult as any).result.config });
        }
      }
    }
  });

  return result.toTextStreamResponse();
}
