"use client";

import { DashboardRenderer } from "@/components/genui/DashboardRenderer";
import { useChatContext } from "@/hooks/use-chat-context";

export default function DashboardPage() {
  const { activeDashboard } = useChatContext();

  return <DashboardRenderer config={activeDashboard} />;
}
