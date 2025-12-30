"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard } from "@/components/ui/StatCard";
import { SmartChart } from "@/components/genui/SmartChart";
import { Calendar } from "@/components/ui/Calendar";
import { CopilotSidebar } from "@/components/layout/CopilotSidebar";

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

  useEffect(() => {
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

  if (!mounted) {
    return <div className="min-h-screen bg-[var(--color-bg)]" />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] overflow-hidden">
      <div className="mx-auto flex w-full max-w-[1440px] h-screen overflow-hidden">
        <Sidebar navItems={defaultNavItems} />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out" style={{ marginRight: isChatOpen ? '400px' : '0' }}>
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
            <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_364px]">
              <SmartChart apiEndpoint="/api/github/usage" title="Copilot Impact (Live)" />
              <Calendar items={calendarItems} />
            </section>
          </main>
        </div>

        <CopilotSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    </div>
  );
}
