"use client";

import { useEffect, useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard } from "@/components/ui/StatCard";
import { Calendar } from "@/components/ui/Calendar";
import { CopilotSidebar } from "@/components/layout/CopilotSidebar";
import { DashboardRenderer } from "@/components/genui/DashboardRenderer";
import { ChatUIMessage } from "@/app/api/chat/route";
import { DashboardTool } from "@/lib/genui/schemas";

const defaultNavItems = [
  { label: "Dashboard", active: true, icon: "grid" },
  { label: "Products", icon: "box" },
  { label: "Customer", icon: "users" },
  { label: "Category", icon: "folder" },
  { label: "Orders", icon: "bag" },
  { label: "Coupons", icon: "tag" },
  { label: "Chats", icon: "chat", badge: "8" },
  { label: "Settings", icon: "settings" },
  { label: "Logout", icon: "logout" },
];

const stats = [
  {
    title: "Total employees",
    value: "5 234",
    accent: "#7b57e0",
    trend: "+10.0%",
  },
  {
    title: "Loyalty account",
    value: "2 215",
    accent: "#50c099",
    trend: "+10.0%",
  },
  {
    title: "Average income",
    value: "$1,096",
    accent: "#5daaee",
    filter: "Month",
  },
  {
    title: "Campaign sent",
    value: "1789",
    accent: "#ffc565",
    filter: "Month",
  },
];

const calendarItems = [
  {
    title: "Summer Campaign is end!",
    time: "16:00",
    color: "#50c099",
  },
  {
    title: "2 plus 1 promotions is end!",
    time: "14:00",
    color: "#ffc565",
  },
  {
    title: "Winter Campaign is end!",
    time: "13:00",
    color: "#5daaee",
  },
  {
    title: "Summer Campaign is end!",
    time: "09:00",
    color: "#7b57e0",
  },
];

const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const stored = window.localStorage.getItem("theme");
  if (stored) {
    return stored === "dark";
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
};

export default function DashboardShell() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 1. Lifted State: Main Chat Hook
  const { messages, sendMessage, status } = useChat<ChatUIMessage>();

  // 2. Derive Active Dashboard from Chat History
  const activeDashboard = useMemo(() => {
    // Iterate backwards to find the most recent tool result
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.parts) {
        for (const part of message.parts) {
          if (part.type === 'tool-render_dashboard' && part.state === 'output-available') {
            return part.output as DashboardTool;
          }
        }
      }
    }
    return null;
  }, [messages]);

  useEffect(() => {
    // eslint-disable-next-line
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

  // Open chat automatically when a dashboard is generated
  useEffect(() => {
    if (activeDashboard && !isChatOpen) {
      // Optional: Auto-open sidebar? Maybe not, can be annoying.
      // setIsChatOpen(true);
    }
  }, [activeDashboard, isChatOpen]);

  if (!mounted) {
    return <div className="min-h-screen bg-[var(--color-bg)]" />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] overflow-hidden">
      <div className="mx-auto flex w-full max-w-[1440px] h-screen overflow-hidden">
        <Sidebar navItems={defaultNavItems} />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out" style={{ marginRight: isChatOpen ? '450px' : '0' }}>
          <main className="flex-1 px-6 py-6 lg:px-8 overflow-y-auto">
            <TopBar 
              isDark={isDark} 
              onToggle={() => setIsDark((prev) => !prev)} 
              onChatToggle={() => setIsChatOpen((prev) => !prev)}
            />
            <section className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => (
                  <StatCard key={item.title} {...item} />
                ))}
              </div>
            </section>
            
            {/* Dynamic Dashboard Section */}
            <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_364px]">
              <div className="min-h-[400px]">
                {activeDashboard ? (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in zoom-in duration-500">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {activeDashboard.layout === 'single' ? activeDashboard.config.title : 'Comparison View'}
                      </h3>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        Generated by Copilot
                      </span>
                    </div>
                    <DashboardRenderer config={activeDashboard} />
                  </div>
                ) : (
                  // Default View (Placeholder or initial state)
                  <div className="h-full bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Ready to Analyze</h3>
                    <p className="text-gray-500 mt-2 max-w-sm">
                      Open the Copilot chat on the right and ask for data visualization.
                      <br/>
                      <span className="text-xs text-gray-400 mt-2 block">Try: Show me usage trends</span>
                    </p>
                  </div>
                )}
              </div>
              <Calendar items={calendarItems} />
            </section>
          </main>
        </div>

        <CopilotSidebar 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          sendMessage={sendMessage}
          status={status}
        />
      </div>
    </div>
  );
}