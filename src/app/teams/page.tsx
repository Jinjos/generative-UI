"use client";

import { DashboardRenderer } from "@/components/genui/DashboardRenderer";
import { usePageBeacon } from "@/hooks/usePageBeacon";
import { DashboardTool } from "@/lib/genui/schemas";

function getLookbackDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export default function TeamsPage() {
  usePageBeacon({ 
    name: "Teams Overview", 
    description: "High-level performance metrics broken down by Engineering Team." 
  });

  const startDate = getLookbackDate(30);
  const endDate = getLookbackDate(0);

  const config: DashboardTool = {
    layout: "dashboard",
    headerStats: [
      {
        component: "SmartStatCard",
        title: "Total Teams",
        apiEndpoint: "/api/metrics/segments", // This returns { segments: string[] } - SmartStatCard might handle array length? No.
        // SmartStatCard expects a key. 
        // We might need a summary endpoint for teams count.
        // Or just show total interactions for now.
        // Let's show "Total Interactions" globally.
        apiEndpoint: `/api/metrics/summary?startDate=${startDate}&endDate=${endDate}`,
        dataKey: "total_interactions",
        filter: "All Teams"
      }
    ],
    slotMain: {
      component: "SmartTable",
      title: "Team Performance Breakdown",
      apiEndpoint: `/api/metrics/breakdown?by=feature&startDate=${startDate}&endDate=${endDate}`,
      tableColumns: [
        { key: "name", label: "Team" },
        { key: "active_users_count", label: "Active Users", format: "number" },
        { key: "interactions_per_user", label: "Interactions / User", format: "number" },
        { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
        { key: "loc_added", label: "LOC Added", format: "number" }
      ]
    },
    slotRightTop: {
      component: "SmartChart",
      title: "Team Adoption (Interactions)",
      apiEndpoint: `/api/metrics/breakdown?by=feature&startDate=${startDate}&endDate=${endDate}`,
      xAxisKey: "name", // Charting by category (Team Name)
      chartSeries: [
        { key: "interactions", label: "Interactions", color: "#3b82f6" }
      ]
    }
  };

  return <DashboardRenderer config={config} />;
}
