"use client";

import { ChatInterface } from "@/components/chat/ChatInterface";
import { useChatContext } from "@/hooks/use-chat-context";

export default function AgentPage() {
  const { messages, sendMessage, status } = useChatContext();

  return (
    <div className="flex h-full flex-col">
      <ChatInterface
        title="Agent"
        placeholder="Ask the Agent to build a dashboard..."
        emptyStateMessage="Ask the Agent to generate a dashboard or analysis."
        messages={messages}
        sendMessage={sendMessage}
        status={status}
      />
    </div>
  );
}
