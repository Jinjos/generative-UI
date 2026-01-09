"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { CopilotSidebar } from "@/components/layout/CopilotSidebar";
import { useChatContext, ChatProvider } from "@/hooks/use-chat-context";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: string;
  href?: string;
  badge?: string;
}

const baseNavItems: NavItem[] = [
  { label: "Dashboard", icon: "grid", href: "/" },
  { label: "Analytics", icon: "activity", href: "/analytics" },
  { label: "Products", icon: "box" },
  { label: "Customer", icon: "users" },
  { label: "Category", icon: "folder" },
  { label: "Orders", icon: "bag" },
  { label: "Coupons", icon: "tag" },
  { label: "Chats", icon: "chat", badge: "8" },
  { label: "Settings", icon: "settings" },
  { label: "Logout", icon: "logout" },
];

// Internal content that consumes the context
function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { 
    messages, 
    sendMessage, 
    status, 
    isChatOpen, 
    setIsChatOpen, 
    isDark, 
    setIsDark 
  } = useChatContext();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const navItems = baseNavItems.map((item: NavItem) => ({
    ...item,
    active: item.href === pathname || (item.label === "Dashboard" && pathname === "/")
  }));

  if (!mounted) {
    return <div className="min-h-screen bg-[var(--color-bg)]" />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] overflow-hidden">
      <div className="flex w-full h-screen overflow-hidden">
        <Sidebar navItems={navItems} />
        
        {/* Main content and Copilot sidebar are now siblings in a flex container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full overflow-y-auto transition-all duration-300 ease-in-out">
            <main className="flex-1 px-6 py-6 lg:px-8 flex flex-col w-full max-w-7xl mx-auto">
              <TopBar 
                isDark={isDark} 
                onToggle={() => setIsDark(!isDark)} 
                onChatToggle={() => setIsChatOpen(!isChatOpen)}
              />
              <div className="mt-6 flex-1">
                {children}
              </div>
            </main>
          </div>

          {/* Copilot Sidebar Container */}
          <div
            className={cn(
              "transition-all duration-300 ease-in-out border-l border-[color:var(--color-stroke)]",
              isChatOpen ? "w-[350px] opacity-100" : "w-0 opacity-0"
            )}
          >
            <CopilotSidebar 
              isOpen={isChatOpen} 
              onClose={() => setIsChatOpen(false)}
              messages={messages}
              sendMessage={sendMessage}
              status={status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main exported component that provides the context
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <AppShellContent>{children}</AppShellContent>
    </ChatProvider>
  );
}
