"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/icons";
import { ChatUIMessage } from "@/app/api/chat/route";

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
  const isLoading = status === "submitted" || status === "streaming";

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
    <div className={`flex flex-col h-full overflow-hidden ${embedded ? '' : 'rounded-xl bg-white shadow-2xl border border-gray-200'}`}>
      {title && (
        <div className="border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <p className="text-lg font-semibold text-gray-800">{title}</p>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth space-y-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <Icon name="chat" className="h-8 w-8 text-gray-300" />
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
                             ? 'bg-blue-600 text-white' 
                             : 'bg-white text-gray-800 border border-gray-100'
                         }`}>
                           <div className="whitespace-pre-wrap text-sm leading-relaxed">{part.text}</div>
                         </div>
                      </div>
                    );
                  }
                  
                  // Generative UI Logic (Notification only)
                  if (part.type === 'tool-render_dashboard') {
                    return (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className="my-1 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-3 max-w-[85%]">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Icon name="layout" className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <span className="text-xs text-blue-700 font-medium">
                            {part.state === 'output-available' ? "Dashboard updated on canvas" : "Designing interface..."}
                          </span>
                        </div>
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
             <div className="bg-gray-100 rounded-2xl px-5 py-3 flex items-center gap-2">
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
             </div>
           </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <input
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-4 pl-5 pr-14 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all shadow-sm"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-md"
          >
            <Icon name="chat" className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}