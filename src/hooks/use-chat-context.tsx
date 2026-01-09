"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { ChatUIMessage } from "@/app/api/chat/route";
import { DashboardTool } from "@/lib/genui/schemas";

interface ChatContextType {
  messages: ChatUIMessage[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage: (message: { text: string } | any) => Promise<void>;
  status: string;
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
  const { messages, status, sendMessage } = useChat<ChatUIMessage>();

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
    sendMessage: sendMessage as (message: { text: string }) => Promise<void>, 
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
