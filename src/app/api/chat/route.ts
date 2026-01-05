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
import { after } from "next/server";
import {
  observe,
  updateActiveObservation,
  updateActiveTrace,
} from "@langfuse/tracing";
import { trace } from "@opentelemetry/api";
import { langfuseSpanProcessor } from "@/instrumentation";

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

  const result = streamText({
    model: openai("gpt-4o"),
    messages: await convertToModelMessages(messages),
    system: `${SYSTEM_PROMPT}\n\n${dateContext}`,
    tools,
    experimental_telemetry: {
      isEnabled: true,
    },
    onFinish: ({ text, toolCalls, usage }) => {
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
    onError: async (error) => {
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
  });

  // Critical for serverless: flush traces before function terminates
  after(async () => await langfuseSpanProcessor.forceFlush());

  return result.toUIMessageStreamResponse();
};

// Wrap handler with observe() to create a Langfuse trace
export const POST = observe(handler, {
  name: "handle-chat-message",
  endOnExit: false, // Don't end observation until stream finishes
});
