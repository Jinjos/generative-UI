"use client";

import React from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CopilotSidebar({ isOpen, onClose }: CopilotSidebarProps) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-[400px] transform bg-[var(--color-unit)] border-l border-[var(--color-stroke)] shadow-2xl transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--color-stroke)] px-6 py-4">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <Icon name="chat" className="h-5 w-5" />
            <span className="font-medium">Copilot</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--color-secondary)] hover:bg-[var(--color-bg)] transition-colors"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ChatInterface 
            title=""
            placeholder="Ask Copilot..."
            emptyStateMessage="I can help analyze your data."
            embedded={true}
          />
        </div>
      </div>
    </div>
  );
}
