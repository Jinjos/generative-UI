"use client";

import { AnalyticsRenderer } from "@/components/genui/AnalyticsRenderer";
import { useChatContext } from "@/hooks/use-chat-context";

export default function AnalyticsPage() {
  const { activeDashboard } = useChatContext();

  return <AnalyticsRenderer config={activeDashboard} />;
}