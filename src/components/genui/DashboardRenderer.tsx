"use client";

import React from "react";
import { SmartChart } from "@/components/genui/SmartChart";
import { KPIGrid } from "@/components/genui/KPIGrid";
import { SmartTable } from "@/components/genui/SmartTable";
import { SplitLayout } from "@/components/layout/SplitLayout";
import type { DashboardTool, ChartConfig } from "@/lib/genui/schemas";

interface DashboardRendererProps {
  config: DashboardTool;
}

export function DashboardRenderer({ config }: DashboardRendererProps) {
  const renderToolComponent = (cfg: ChartConfig) => {
    if (cfg.component === 'KPIGrid') {
      return (
        <KPIGrid 
          apiEndpoint={cfg.apiEndpoint} 
          definitions={cfg.kpiDefinitions}
        />
      );
    }
    if (cfg.component === 'SmartTable') {
      return (
        <SmartTable
          apiEndpoint={cfg.apiEndpoint}
          title={cfg.title}
          columns={cfg.tableColumns || []}
        />
      );
    }
    return (
      <SmartChart 
        apiEndpoint={cfg.apiEndpoint} 
        title={cfg.title} 
        xAxisKey={cfg.xAxisKey}
        series={cfg.chartSeries}
      />
    );
  };

  if (config.layout === 'single') {
    return renderToolComponent(config.config);
  }
  
  if (config.layout === 'split') {
    return (
      <SplitLayout 
        left={renderToolComponent(config.leftChart)}
        right={renderToolComponent(config.rightChart)}
      />
    );
  }

  return null;
}
