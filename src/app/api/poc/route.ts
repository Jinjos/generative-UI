import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  InferUITools,
  streamText,
  tool,
  UIDataTypes,
  UIMessage,
} from 'ai';
import { z } from 'zod';
import { DashboardToolSchema } from "@/lib/genui/schemas";
import { SYSTEM_PROMPT } from "@/config/ai/system-prompt";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const renderDashboardTool = tool({
  description: "Render a dashboard with charts, KPI grids, or tables based on user request.",
  inputSchema: z.object({
    config: DashboardToolSchema,
  }),
  execute: async ({ config }) => {
    return config;
  },
});

const tools = {
  render_dashboard: renderDashboardTool,
} as const;

export type UseChatToolsMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<typeof tools>
>;

export async function POST(req: Request) {
  const body = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: await convertToModelMessages(body.messages),
    system: SYSTEM_PROMPT,
    tools,
  });

  return result.toUIMessageStreamResponse();
}