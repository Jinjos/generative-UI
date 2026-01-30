"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useChat, type UseChatHelpers } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatUIMessage } from "@/app/api/chat/route";
import { DashboardTool } from "@/lib/genui/schemas";
import { useBeacon } from "@/components/genui/BeaconProvider";

type ChatRequestBody = {
  chatId: string;
  persona: "architect" | "analyst";
};

let latestChatRequestBody: ChatRequestBody = { chatId: "", persona: "architect" };
const getChatRequestBody = () => latestChatRequestBody;

interface ChatContextType {
  messages: ChatUIMessage[];
  sendMessage: UseChatHelpers<ChatUIMessage>["sendMessage"];
  status: UseChatHelpers<ChatUIMessage>["status"];
  activeDashboard: DashboardTool | null;
  setActiveDashboard: (dashboard: DashboardTool | null) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const getInitialTheme = () => {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem("theme");
  if (stored) return stored === "dark";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { sessionId, views } = useBeacon();
  // Determine persona: if we have registered views (content), we are an Analyst.
  const persona = views.length > 0 ? "analyst" : "architect";

  useEffect(() => {
    latestChatRequestBody = { chatId: sessionId, persona };
  }, [sessionId, persona]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatUIMessage>({
        body: getChatRequestBody,
      }),
    []
  );

  const { messages, status, sendMessage } = useChat<ChatUIMessage>({
    transport,
  });

  const [activeDashboard, setActiveDashboard] = useState<DashboardTool | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(getInitialTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark, mounted]);

  const value = {
    messages,
    sendMessage,
    status,
    activeDashboard,
    setActiveDashboard,
    isChatOpen,
    setIsChatOpen,
    isDark,
    setIsDark
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
