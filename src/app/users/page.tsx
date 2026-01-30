"use client";

import { DashboardRenderer } from "@/components/genui/DashboardRenderer";
import { usePageBeacon } from "@/hooks/usePageBeacon";
import { DashboardTool } from "@/lib/genui/schemas";

function getLookbackDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export default function UsersPage() {
  usePageBeacon({ 
    name: "User Directory", 
    description: "Leaderboard of all users sorted by activity and code contribution." 
  });

  const startDate = getLookbackDate(30);
  const endDate = getLookbackDate(0);

  const config: DashboardTool = {
    layout: "dashboard",
    headerStats: [
      {
        component: "SmartStatCard",
        title: "Active Users",
        apiEndpoint: `/api/metrics/summary?startDate=${startDate}&endDate=${endDate}`,
        dataKey: "active_users_count",
        filter: "30 Days"
      },
      {
        component: "SmartStatCard",
        title: "Total Interactions",
        apiEndpoint: `/api/metrics/summary?startDate=${startDate}&endDate=${endDate}`,
        dataKey: "total_interactions",
        filter: "30 Days"
      },
      {
        component: "SmartStatCard",
        title: "Avg Acceptance Rate",
        apiEndpoint: `/api/metrics/summary?startDate=${startDate}&endDate=${endDate}`,
        dataKey: "acceptance_rate",
        filter: "30 Days"
      }
    ],
    slotMain: {
      component: "SmartTable",
      title: "Top Performers (Last 30 Days)",
      apiEndpoint: `/api/metrics/users?startDate=${startDate}&endDate=${endDate}`,
      tableColumns: [
        { key: "name", label: "User" },
        { key: "interactions", label: "Interactions", format: "number" },
        { key: "loc_added", label: "LOC Added", format: "number" },
        { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
        { key: "ide", label: "Primary IDE" }
      ]
    }
  };

  return <DashboardRenderer config={config} />;
}
