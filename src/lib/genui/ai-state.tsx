"use server";

import { createAI, getMutableAIState, streamUI } from "@ai-sdk/rsc";
import { openai } from "@ai-sdk/openai";
import { nanoid } from "nanoid";
import { DashboardToolSchema } from "@/lib/genui/schemas";
import { SYSTEM_PROMPT } from "@/config/ai/system-prompt";
import { SmartChart } from "@/components/genui/SmartChart";
import { KPIGrid } from "@/components/genui/KPIGrid";
import { SplitLayout } from "@/components/layout/SplitLayout";
import { SmartTable } from "@/components/genui/SmartTable";

export interface ServerMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface ClientMessage {
  id: string;
  role: 'user' | 'assistant';
  display: React.ReactNode;
}

export async function submitUserMessage(input: string): Promise<ClientMessage> {
  'use server';

  const aiState = getMutableAIState<typeof AI>();
  
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: input,
    },
  ]);

  console.log("🚀 [Server] Submitting Messages:", aiState.get());

  const result = await streamUI({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages: aiState.get().map((info: ServerMessage) => ({
      role: info.role,
      content: info.content,
      name: info.name,
    })),
    text: async function* ({ content, done }) {
      if (done) {
        aiState.done([
          ...aiState.get(),
          {
            role: "assistant",
            content: content,
          },
        ]);
      }
      return <div className="mb-4 text-sm text-[var(--color-secondary)]">{content}</div>;
    },
    tools: {
      render_dashboard: {
        description: "Render a dashboard with charts based on data needs",
        inputSchema: DashboardToolSchema,
        generate: async (config) => {
          aiState.done([
            ...aiState.get(),
            {
              role: "assistant",
              content: `[Generated Dashboard: ${config.layout}]`,
              toolCallId: nanoid(),
            }
          ]);

          if (config.layout === 'single') {
            return (
              <div className="my-4">
                {config.config.component === 'KPIGrid' ? (
                  <KPIGrid 
                    apiEndpoint={config.config.apiEndpoint} 
                    definitions={config.config.kpiDefinitions}
                  />
                ) : config.config.component === 'SmartTable' ? (
                  <SmartTable
                    apiEndpoint={config.config.apiEndpoint}
                    title={config.config.title}
                    columns={config.config.tableColumns || []}
                  />
                ) : (
                  <SmartChart 
                    apiEndpoint={config.config.apiEndpoint} 
                    title={config.config.title} 
                    xAxisKey={config.config.xAxisKey}
                    series={config.config.chartSeries}
                  />
                )}
              </div>
            );
          }
          
          if (config.layout === 'split') {
            return (
              <div className="my-4">
                <SplitLayout 
                  left={
                    <SmartChart 
                      apiEndpoint={config.leftChart.apiEndpoint} 
                      title={config.leftChart.title} 
                      xAxisKey={config.leftChart.xAxisKey}
                      series={config.leftChart.chartSeries}
                    />
                  }
                  right={
                    <SmartChart 
                      apiEndpoint={config.rightChart.apiEndpoint} 
                      title={config.rightChart.title} 
                      xAxisKey={config.rightChart.xAxisKey}
                      series={config.rightChart.chartSeries}
                    />
                  }
                />
              </div>
            );
          }
          
          return <div>Unknown Layout</div>;
        }
      }
    }
  });

  return {
    id: nanoid(),
    role: 'assistant',
    display: result.value,
  };
}

export const AI = createAI<ServerMessage[], ClientMessage[], {
  submitUserMessage: typeof submitUserMessage
}>({
  actions: {
    submitUserMessage,
  },
  initialAIState: [],
  initialUIState: [],
});
