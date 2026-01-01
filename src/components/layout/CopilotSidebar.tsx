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
        "fixed inset-y-0 right-0 z-50 w-[450px] transform bg-white border-l border-gray-200 shadow-2xl transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-800">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Icon name="chat" className="h-5 w-5 text-blue-600" />
            </div>
            <span className="font-semibold">Copilot</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden bg-white">
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