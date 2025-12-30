"use client";

import React, { useState } from "react";
import { useUIState, useActions } from "@ai-sdk/rsc";
import type { AI } from "@/lib/genui/ai-state";
import { Icon } from "@/components/ui/icons";

interface ChatInterfaceProps {
  placeholder?: string;
  emptyStateMessage?: string;
  title?: string;
  embedded?: boolean;
}

export function ChatInterface({ 
  placeholder = "Type a message...", 
  emptyStateMessage = "How can I help you today?",
  title,
  embedded = false
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const value = inputValue;
    setInputValue("");
    setIsPending(true);

    // Add user message immediately
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now().toString(),
        role: "user",
        display: <div className="mb-4 text-right text-sm font-medium text-[var(--color-primary)]">{value}</div>,
      },
    ]);

    try {
      const responseMessage = await submitUserMessage(value);
      setMessages((currentMessages) => [...currentMessages, responseMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${embedded ? '' : 'rounded-[8px] bg-[var(--color-unit)] shadow-card h-[600px]'}`}>
      {title && (
        <div className="border-b border-[var(--color-stroke)] px-6 py-4">
          <p className="text-lg font-medium text-[color:var(--color-primary)]">{title}</p>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-[var(--color-secondary)] opacity-60">
            <Icon name="chat" className="mb-2 h-8 w-8" />
            <p>{emptyStateMessage}</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {message.display}
            </div>
          ))
        )}
        {isPending && (
           <div className="mb-4 text-sm text-[var(--color-secondary)] animate-pulse">
             Thinking...
           </div>
        )}
      </div>

      <div className="border-t border-[var(--color-stroke)] p-4">
        <form onSubmit={handleSubmit} className="relative">
          <input
            className="w-full rounded-full border border-[var(--color-stroke)] bg-[var(--color-unit-2)] py-3 pl-5 pr-12 text-sm text-[var(--color-primary)] placeholder:text-[var(--color-secondary)] focus:border-[var(--color-highlight)] focus:outline-none"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[var(--color-highlight)] p-2 text-white transition-opacity disabled:opacity-50"
          >
            <Icon name="chat" className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}