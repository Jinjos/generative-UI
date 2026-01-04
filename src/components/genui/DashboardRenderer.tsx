"use client";

import React from "react";
import { SmartChart } from "@/components/genui/SmartChart";
import { KPIGrid } from "@/components/genui/KPIGrid";
import { SmartTable } from "@/components/genui/SmartTable";
import { SplitLayout } from "@/components/layout/SplitLayout";
import { SmartStatCard } from "@/components/genui/SmartStatCard";
import type { DashboardTool, ChartConfig } from "@/lib/genui/schemas";

interface DashboardRendererProps {
  config: DashboardTool | null;
}

export function DashboardRenderer({ config }: DashboardRendererProps) {
  // Helper to render tools
  const renderToolComponent = (cfg: ChartConfig) => {
    if (cfg.component === 'KPIGrid') {
      return <KPIGrid apiEndpoint={cfg.apiEndpoint} definitions={cfg.kpiDefinitions} />;
    }
    if (cfg.component === 'SmartTable') {
      return <SmartTable apiEndpoint={cfg.apiEndpoint} title={cfg.title} columns={cfg.tableColumns || []} />;
    }
    return <SmartChart apiEndpoint={cfg.apiEndpoint} title={cfg.title} filter={cfg.filter} xAxisKey={cfg.xAxisKey} series={cfg.chartSeries} />;
  };

  // --- Initial Load State ---
  if (!config) {
    return (
      <div className="h-full bg-[var(--color-unit)] p-6 rounded-xl shadow-sm border border-[color:var(--color-stroke)] flex flex-col items-center justify-center text-center min-h-[600px]">
        <div className="w-16 h-16 bg-[var(--color-soft-lavender)] rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-[color:var(--color-primary)]">Ready to Analyze</h3>
        <p className="text-[color:var(--color-secondary)] mt-2 max-w-sm text-sm">
          Open the Copilot chat on the right and ask for data visualization.
          <br/>
          <span className="text-xs text-[color:var(--color-secondary)] opacity-70 mt-2 block">Try: Show me a full dashboard</span>
        </p>
      </div>
    );
  }

  // --- Layout Logic ---
  
  // 1. Dashboard Layout (Stats + Main)
  if (config.layout === 'dashboard') {
    const statsCount = config.headerStats?.length || 0;
    // Explicitly handle 1, 2, 3, or 4 items to fill the row perfectly
    const gridCols = 
      statsCount === 4 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' :
      statsCount === 3 ? 'grid-cols-1 md:grid-cols-3' :
      statsCount === 2 ? 'grid-cols-1 md:grid-cols-2' : 
      'grid-cols-1';

    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Dynamic Stats Row */}
        <section className="mb-6">
          <div className={`grid gap-6 ${gridCols}`}>
            {config.headerStats?.map((stat, i) => (
              <SmartStatCard key={i} {...stat} />
            ))}
          </div>
        </section>

        {/* Center Canvas */}
          {renderToolComponent(config.slotMain)}
      </div>
    );
  }

  // 2. Single Layout
  if (config.layout === 'single') {
    return (
      <div>
        {/* <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[color:var(--color-primary)]">{config.config.title}</h3>
          <span className="text-xs font-medium text-[color:var(--color-highlight)] bg-[var(--color-soft-lavender)] px-2 py-1 rounded-full">Direct View</span>
        </div> */}
        {renderToolComponent(config.config)}
      </div>
    );
  }

  // 3. Split Layout
  if (config.layout === 'split') {
    return (
      <div className="bg-[var(--color-unit)] p-6 rounded-xl shadow-sm border border-[color:var(--color-stroke)] animate-in fade-in zoom-in duration-500 h-full min-h-[500px]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[color:var(--color-primary)]">Comparison View</h3>
          <span className="text-xs font-medium text-[color:var(--color-highlight)] bg-[var(--color-soft-lavender)] px-2 py-1 rounded-full">Side-by-Side</span>
        </div>
        <SplitLayout 
          left={renderToolComponent(config.leftChart)}
          right={renderToolComponent(config.rightChart)}
        />
      </div>
    );
  }

  return null;
}

