"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/icons";
import { ChatUIMessage } from "@/app/api/chat/route";
import { useChatContext } from "@/hooks/use-chat-context";
import { DashboardTool } from "@/lib/genui/schemas";

interface ChatInterfaceProps {
  placeholder?: string;
  emptyStateMessage?: string;
  title?: string;
  embedded?: boolean;
  messages: ChatUIMessage[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage: (message: any) => Promise<void>;
  status: string;
}

export function ChatInterface({ 
  placeholder = "Type a message...", 
  emptyStateMessage = "How can I help you today?",
  title,
  embedded = false,
  messages,
  sendMessage,
  status
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const { setActiveDashboard } = useChatContext();
  const isLoading = status === "submitted" || status === "streaming";

  const handleShowDashboard = (output: unknown) => {
    // New structure: { config, snapshotId, summary }
    if (typeof output === "object" && output !== null && "config" in output) {
      setActiveDashboard((output as { config: DashboardTool }).config);
    } else {
      setActiveDashboard(output as DashboardTool);
    }
    // Keep chat open so user can read the explanation while viewing data
    // setIsChatOpen(false); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const value = input;
    setInput("");

    await sendMessage({
      text: value, 
    }); 
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${embedded ? '' : 'rounded-xl bg-[var(--color-unit)] shadow-2xl border border-[color:var(--color-stroke)]'}`}>
      {title && (
        <div className="border-b border-[color:var(--color-stroke)] px-6 py-4 bg-[var(--color-bg)]">
          <p className="text-lg font-semibold text-[color:var(--color-primary)]">{title}</p>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth space-y-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-[color:var(--color-secondary)]">
            <div className="p-4 bg-[var(--color-bg)] rounded-full mb-4">
              <Icon name="chat" className="h-8 w-8 text-[color:var(--color-secondary)]" />
            </div>
            <p className="text-lg font-medium">{emptyStateMessage}</p>
          </div>
        ) : (
          messages.map((message) => {
            console.log(`[ChatDebug] Message ID: ${message.id}, Role: ${message.role}, Parts:`, message.parts);
            return (
              <div key={message.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-2">
                
                {message.parts?.map((part, index) => {
                  console.log(`[ChatDebug] Part ${index}: type=${part.type}`);
                  if (part.type === 'text' && part.text.trim()) {
                    return (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
                           message.role === 'user' 
                             ? 'bg-[var(--color-highlight)] text-white' 
                             : 'bg-[var(--color-unit)] text-[color:var(--color-primary)] border border-[color:var(--color-stroke)]'
                         }`}>
                           <div className="whitespace-pre-wrap text-sm leading-relaxed">{part.text}</div>
                         </div>
                      </div>
                    );
                  }
                  
                  // Generative UI Logic (Notification and Action)
                  if (part.type === 'tool-render_dashboard') {
                    const isAvailable = part.state === 'output-available';
                    return (
                      <div key={index} className="flex flex-col items-center gap-3 my-4">
                        <div className="px-3 py-1.5 bg-[var(--color-bg)] rounded-full border border-[color:var(--color-stroke)] flex items-center gap-2">
                          <Icon name="layout" className="w-3 h-3 text-[color:var(--color-secondary)]" />
                          <span className="text-[10px] text-[color:var(--color-secondary)] font-medium uppercase tracking-wider">
                            {isAvailable ? "Dashboard ready" : "Designing..."}
                          </span>
                        </div>
                        
                        {isAvailable && (
                          <button
                            onClick={() => handleShowDashboard(part.output)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-unit)] border border-[color:var(--color-stroke)] rounded-lg text-sm font-medium text-[color:var(--color-primary)] hover:bg-[var(--color-bg)] transition-all shadow-sm group"
                          >
                            <Icon name="grid" className="w-4 h-4 text-[color:var(--color-highlight)] group-hover:scale-110 transition-transform" />
                            View Dashboard
                          </button>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            );
          })
        )}
        {isLoading && (
           <div className="flex justify-start mb-4">
             <div className="bg-[var(--color-bg)] rounded-2xl px-5 py-3 flex items-center gap-2">
               <span className="w-2 h-2 bg-[var(--color-secondary)] rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-[var(--color-secondary)] rounded-full animate-bounce [animation-delay:0.2s]"></span>
               <span className="w-2 h-2 bg-[var(--color-secondary)] rounded-full animate-bounce [animation-delay:0.4s]"></span>
             </div>
           </div>
        )}
      </div>

      <div className="p-4 bg-[var(--color-unit)] border-t border-[color:var(--color-stroke)]">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <input
            className="w-full rounded-xl border border-[color:var(--color-stroke)] bg-[var(--color-bg)] py-4 pl-5 pr-14 text-sm text-[color:var(--color-primary)] placeholder:text-[color:var(--color-secondary)] focus:border-[color:var(--color-highlight)] focus:bg-[var(--color-unit)] focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all shadow-sm"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[var(--color-highlight)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors shadow-md"
          >
            <Icon name="chat" className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}