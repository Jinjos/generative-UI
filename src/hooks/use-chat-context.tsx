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
  roomId: string | null; // New
  setRoomId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const getInitialTheme = () => {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem("theme");
  if (stored) return stored === "dark";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
};

// Internal component that manages the actual Chat Hook lifecycle
function InnerChatLogic({ 
  children, 
  roomId, 
  setRoomId, 
  isDark, 
  setIsDark, 
  isChatOpen, 
  setIsChatOpen 
}: { 
  children: React.ReactNode; 
  roomId: string | null; 
  setRoomId: (id: string | null) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}) {
  const api = roomId ? `/api/rooms/${roomId}` : "/api/chat";
  
  console.log(`[InnerChatLogic] Initializing useChat with api=${api}`);

  const { messages, setMessages, status, sendMessage } = useChat<ChatUIMessage>({
    api,
    id: roomId || "global", // Explicit ID to help SWR caching inside useChat
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const [activeDashboard, setActiveDashboard] = useState<DashboardTool | null>(null);

  // Poll for shared room state (Messages + Dashboard)
  useEffect(() => {
    if (!roomId) return;

    const syncRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        console.log(`🔍 [ChatProvider] Poll Result: ${data.messages?.length} messages in DB vs ${messages.length} local`);
        
        if (data.messages && data.messages.length > messages.length) {
          console.log(`🏠 [ChatProvider] Syncing ${data.messages.length} messages from room ${roomId}`);
          setMessages(data.messages);
        }

        if (data.dashboardConfig) {
          setActiveDashboard(data.dashboardConfig);
        }
      } catch (err) {
        console.error("Failed to sync room:", err);
      }
    };

    const interval = setInterval(syncRoom, 3000);
    return () => clearInterval(interval);
  }, [roomId, messages.length, setMessages]);

  const value = {
    messages,
    sendMessage: sendMessage as (message: { text: string }) => Promise<void>, 
    status,
    activeDashboard,
    setActiveDashboard,
    isChatOpen,
    setIsChatOpen,
    isDark,
    setIsDark,
    roomId, // New
    setRoomId
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [roomId, setRoomId] = useState<string | null>(null);
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

  // Force remount of InnerChatLogic when roomId changes by using it as a KEY
  return (
    <InnerChatLogic 
      key={roomId || "global"} 
      roomId={roomId}
      setRoomId={setRoomId}
      isDark={isDark}
      setIsDark={setIsDark}
      isChatOpen={isChatOpen}
      setIsChatOpen={setIsChatOpen}
    >
      {children}
    </InnerChatLogic>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}