"use client";

import { DashboardRenderer } from "@/components/genui/DashboardRenderer";
import { usePageBeacon } from "@/hooks/usePageBeacon";
import { DashboardTool } from "@/lib/genui/schemas";

function getLookbackDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export default function ModelsPage() {
  usePageBeacon({ 
    name: "Model Registry", 
    description: "Usage and performance metrics for AI Models (GPT-4, Claude, etc)." 
  });

  const startDate = getLookbackDate(30);
  const endDate = getLookbackDate(0);

  const config: DashboardTool = {
    layout: "split",
    leftChart: {
      component: "SmartChart",
      title: "Model Popularity (Interactions)",
      apiEndpoint: `/api/metrics/breakdown?by=model&startDate=${startDate}&endDate=${endDate}`,
      xAxisKey: "name", // Charting by Model Name
      chartSeries: [
        { key: "interactions", label: "Interactions", color: "#8b5cf6" }
      ]
    },
    rightChart: {
      component: "SmartTable",
      title: "Model Quality Metrics",
      apiEndpoint: `/api/metrics/breakdown?by=model&startDate=${startDate}&endDate=${endDate}`,
      tableColumns: [
        { key: "name", label: "Model" },
        { key: "acceptance_rate", label: "Acceptance Rate", format: "percentage" },
        { key: "loc_added", label: "LOC Added", format: "number" }
      ]
    }
  };

  return <DashboardRenderer config={config} />;
}
