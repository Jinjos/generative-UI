"use client";

import { AnalyticsRenderer } from "@/components/genui/AnalyticsRenderer";
import { useChatContext } from "@/hooks/use-chat-context";
import { usePageBeacon } from "@/hooks/usePageBeacon";

export default function AnalyticsPage() {
  const { activeDashboard } = useChatContext();

  usePageBeacon({ 
    name: "Analytics", 
    description: "Deep dive analytics view. Shows detailed breakdowns and trends." 
  });

  return <AnalyticsRenderer config={activeDashboard} />;
}