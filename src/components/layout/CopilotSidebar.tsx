"use client";

import React from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { ChatUIMessage } from "@/app/api/chat/route";

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatUIMessage[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage: (message: any) => Promise<void>;
  status: string;
}

export function CopilotSidebar({ isOpen, onClose, messages, sendMessage, status }: CopilotSidebarProps) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-[450px] transform bg-[var(--color-unit)] border-l border-[color:var(--color-stroke)] shadow-2xl transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[color:var(--color-stroke)] px-6 py-4 bg-[var(--color-bg)]">
          <div className="flex items-center gap-2 text-[color:var(--color-primary)]">
            <div className="p-1.5 bg-[var(--color-soft-lavender)] rounded-md">
              <Icon name="chat" className="h-5 w-5 text-[color:var(--color-highlight)]" />
            </div>
            <span className="font-semibold">Copilot</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[color:var(--color-secondary)] hover:bg-[var(--color-bg)] hover:text-[color:var(--color-primary)] transition-colors"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden bg-[var(--color-unit)]">
          <ChatInterface 
            title=""
            placeholder="Ask Copilot..."
            emptyStateMessage="I can help analyze your data."
            embedded={true}
            messages={messages}
            sendMessage={sendMessage}
            status={status}
          />
        </div>
      </div>
    </div>
  );
}