"use client";

import { DashboardRenderer } from "@/components/genui/DashboardRenderer";
import { useChatContext } from "@/hooks/use-chat-context";
import { usePageBeacon } from "@/hooks/usePageBeacon";

export default function DashboardPage() {
  const { activeDashboard } = useChatContext();
  
  usePageBeacon({ 
    name: "Dashboard", 
    description: "The main AI-generated dashboard workspace. Empty by default until the user asks for a visualization." 
  });

  return <DashboardRenderer config={activeDashboard} />;
}
