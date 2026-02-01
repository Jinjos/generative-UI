"use client";

import { DashboardRenderer } from "@/components/genui/DashboardRenderer";
import { usePageBeacon } from "@/hooks/usePageBeacon";
import { DashboardTool } from "@/lib/genui/schemas";

function getLookbackDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export default function InsightsPage() {
  usePageBeacon({
    name: "Insights Hub",
    description: "KPI grid, comparison cards, and trend insights for the last 30 days.",
  });

  const startDate = getLookbackDate(30);
  const endDate = getLookbackDate(0);

  const entityA = encodeURIComponent(
    JSON.stringify({ label: "Backend-Platform", segment: "Backend-Platform" })
  );
  const entityB = encodeURIComponent(
    JSON.stringify({ label: "QA", segment: "QA" })
  );

  const config: DashboardTool = {
    layout: "dashboard",
    headerStats: [
      {
        component: "SmartStatCard",
        title: "Active Users",
        apiEndpoint: `/api/metrics/summary?startDate=${startDate}&endDate=${endDate}`,
        dataKey: "active_users_count",
        filter: "30 Days",
      },
      {
        component: "SmartStatCard",
        title: "Total Interactions",
        apiEndpoint: `/api/metrics/summary?startDate=${startDate}&endDate=${endDate}`,
        dataKey: "total_interactions",
        filter: "30 Days",
      },
      {
        component: "SmartStatCard",
        title: "Total LOC Added",
        apiEndpoint: `/api/metrics/summary?startDate=${startDate}&endDate=${endDate}`,
        dataKey: "total_loc_added",
        filter: "30 Days",
      },
    ],
    slotMain: {
      component: "KPIGrid",
      title: "KPI Overview",
      apiEndpoint: `/api/metrics/summary?startDate=${startDate}&endDate=${endDate}`,
      kpiDefinitions: [
        { key: "total_interactions", label: "Interactions", format: "suffix_k" },
        { key: "total_suggestions", label: "Suggestions", format: "suffix_k" },
        { key: "total_loc_added", label: "LOC Added", format: "suffix_k" },
        { key: "active_users_count", label: "Active Users", format: "number" },
      ],
    },
    slotRightTop: {
      component: "CompareStatCard",
      title: "Acceptance Gap",
      filter: "30 Days",
      apiEndpoint: `/api/metrics/compare/summary?startDate=${startDate}&endDate=${endDate}&entityA=${entityA}&entityB=${entityB}&metricKey=acceptance_rate`,
    },
    slotRightBottom: {
      component: "SmartChart",
      title: "Interaction Trend",
      filter: "30 Days",
      apiEndpoint: `/api/metrics/trends?startDate=${startDate}&endDate=${endDate}`,
      chartSeries: [
        { key: "interactions", label: "Interactions", color: "var(--color-chart-1)" },
        { key: "suggestions", label: "Suggestions", color: "var(--color-chart-2)" },
      ],
    },
  };

  return <DashboardRenderer config={config} />;
}
