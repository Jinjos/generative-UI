"use client";

import { DashboardRenderer } from "@/components/genui/DashboardRenderer";
import { usePageBeacon } from "@/hooks/usePageBeacon";
import { DashboardTool } from "@/lib/genui/schemas";

function getLookbackDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export default function ComparisonsPage() {
  usePageBeacon({
    name: "Comparisons Lab",
    description: "Side-by-side team comparisons across the last 30 days.",
  });

  const startDate = getLookbackDate(30);
  const endDate = getLookbackDate(0);

  const entityA = encodeURIComponent(
    JSON.stringify({ label: "Backend-Platform", segment: "Backend-Platform" })
  );
  const entityB = encodeURIComponent(
    JSON.stringify({ label: "QA", segment: "QA" })
  );
  const queries = encodeURIComponent(
    JSON.stringify([
      { label: "Backend-Platform", segment: "Backend-Platform" },
      { label: "QA", segment: "QA" },
    ])
  );

  const config: DashboardTool = {
    layout: "split",
    leftChart: {
      component: "CompareStatCard",
      title: "Acceptance Rate Gap",
      filter: "30 Days",
      apiEndpoint: `/api/metrics/compare/summary?startDate=${startDate}&endDate=${endDate}&entityA=${entityA}&entityB=${entityB}&metricKey=acceptance_rate`,
    },
    rightChart: {
      component: "SmartChart",
      title: "Team Interaction Trend",
      filter: "30 Days",
      apiEndpoint: `/api/metrics/compare/trends?startDate=${startDate}&endDate=${endDate}&queries=${queries}&metricKey=interactions`,
      chartSeries: [
        { key: "Backend-Platform", label: "Backend-Platform", color: "var(--color-chart-1)" },
        { key: "QA", label: "QA", color: "var(--color-chart-2)" },
      ],
    },
  };

  return <DashboardRenderer config={config} />;
}
