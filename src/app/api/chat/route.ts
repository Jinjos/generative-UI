import { openai } from "@ai-sdk/openai";
import { 
  streamText, 
  tool, 
  InferUITools, 
  UIMessage, 
  UIDataTypes,
  convertToModelMessages
} from "ai";
import { z } from "zod";
import { DashboardToolSchema } from "@/lib/genui/schemas";
import { SYSTEM_PROMPT } from "@/config/ai/system-prompt";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const renderDashboardTool = tool({
  description: "Render a dashboard with charts, KPI grids, or tables based on user request.",
  // Use inputSchema as per standard example
  inputSchema: z.object({
    config: DashboardToolSchema,
  }),
  execute: async ({ config }) => {
    console.log("🛠️ [Server] render_dashboard triggered with config:", JSON.stringify(config, null, 2));
    // The return value will be available in part.output on the client
    return config;
  },
});

const tools = {
  render_dashboard: renderDashboardTool,
} as const;

// Export the message type for the client to use
export type ChatUIMessage = UIMessage<never, UIDataTypes, InferUITools<typeof tools>>;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages: await convertToModelMessages(messages),
    system: SYSTEM_PROMPT,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
