'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { UseChatToolsMessage } from '../api/poc/route';
import { useState, useMemo } from 'react';
import { SmartChart } from "@/components/genui/SmartChart";
import { KPIGrid } from "@/components/genui/KPIGrid";
import { SmartTable } from "@/components/genui/SmartTable";
import { SplitLayout } from "@/components/layout/SplitLayout";
import { Icon } from "@/components/ui/icons";
import { ChartConfig } from "@/lib/genui/schemas";

export default function ChatCanvasLayout() {
  const { messages, sendMessage, status } =
    useChat<UseChatToolsMessage>({
      transport: new DefaultChatTransport({ api: '/api/poc' }),
    });

  const [input, setInput] = useState('');

  // 1. Extract the latest valid dashboard config from the chat history
  const activeDashboard = useMemo(() => {
    // Iterate backwards to find the most recent tool result
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.parts) {
        for (const part of message.parts) {
          if (part.type === 'tool-render_dashboard' && part.state === 'output-available') {
            return part.output; // Found the latest dashboard!
          }
        }
      }
    }
    return null;
  }, [messages]);

  // Helper to render specific component types
  const renderToolComponent = (cfg: ChartConfig) => {
    if (cfg.component === 'KPIGrid') {
      return (
        <KPIGrid 
          apiEndpoint={cfg.apiEndpoint} 
          definitions={cfg.kpiDefinitions}
        />
      );
    }
    if (cfg.component === 'SmartTable') {
      return (
        <SmartTable
          apiEndpoint={cfg.apiEndpoint}
          title={cfg.title}
          columns={cfg.tableColumns || []}
        />
      );
    }
    return (
      <SmartChart 
        apiEndpoint={cfg.apiEndpoint} 
        title={cfg.title} 
        xAxisKey={cfg.xAxisKey}
        series={cfg.chartSeries}
      />
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* --- LEFT PANEL: CHAT --- */}
      <div className="w-[400px] flex flex-col border-r bg-white shadow-xl z-10">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-700">Chat Assistant</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages?.map(message => (
            <div key={message.id} className={`p-3 rounded-lg text-sm ${message.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100'}`}>
              <div className="font-bold text-xs text-gray-500 mb-1 uppercase">{message.role}</div>
              
              {message.parts?.map((part, index) => {
                if (part.type === 'text') {
                  return <div key={index}>{part.text}</div>;
                }
                
                // Instead of rendering the chart here, we render a "reference" card
                if (part.type === 'tool-render_dashboard') {
                  if (part.state === 'output-available') {
                    return (
                      <div key={index} className="mt-2 p-3 bg-white border border-blue-200 rounded-md shadow-sm cursor-pointer hover:bg-blue-50 transition-colors group">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Icon name="layout" className="w-4 h-4" />
                          <span className="font-medium">Generated Dashboard</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Layout: {part.output.layout}
                        </div>
                        <div className="text-xs text-blue-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          View on Canvas →
                        </div>
                      </div>
                    );
                  }
                  return <div key={index} className="text-xs text-gray-400 animate-pulse">Generating UI...</div>;
                }
                return null;
              })}
            </div>
          ))}
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          const val = input;
          setInput('');
          await sendMessage({ text: val });
        }} className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              className="flex-1 p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your request..."
              disabled={status === 'streaming'}
            />
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              disabled={!input.trim() || status === 'streaming'}
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* --- RIGHT PANEL: CANVAS (DASHBOARD) --- */}
      <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
        {activeDashboard ? (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Live Dashboard</h1>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">
                Live Data
              </span>
            </div>

            {/* Render the extracted config here */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              {activeDashboard.layout === 'single' ? (
                renderToolComponent(activeDashboard.config)
              ) : (
                <SplitLayout 
                  left={renderToolComponent(activeDashboard.leftChart)}
                  right={renderToolComponent(activeDashboard.rightChart)}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 animate-pulse"></div>
            <p className="text-lg font-medium">Ready to visualize data</p>
            <p className="text-sm">Ask the assistant to generate a chart or dashboard.</p>
          </div>
        )}
      </div>

    </div>
  );
}
