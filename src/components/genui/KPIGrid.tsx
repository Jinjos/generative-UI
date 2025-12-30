"use client";

import React from "react";
import { useDataFetcher } from "@/hooks/useDataFetcher";
import { getNestedValue } from "@/lib/utils/object";
import { StatCard } from "@/components/ui/StatCard";

interface KPIDefinition {
  key: string;
  label: string;
  accent: string;
  format?: "number" | "currency" | "suffix_k";
  trendKey?: string;
}

interface KPIDataResponse {
  summary?: Record<string, unknown>;
  [key: string]: unknown;
}

interface KPIGridProps {
  apiEndpoint: string;
  definitions?: KPIDefinition[];
}

const formatValue = (val: unknown, format?: string) => {
  if (typeof val !== 'number') return "-";
  if (format === "suffix_k") return (val / 1000).toFixed(1) + "k";
  if (format === "currency") return "$" + val.toLocaleString();
  return val.toLocaleString();
};

export function KPIGrid({ apiEndpoint, definitions = [] }: KPIGridProps) {
  const { data, loading, error } = useDataFetcher<KPIDataResponse>(apiEndpoint);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-[8px] bg-[var(--color-unit)] shadow-card opacity-50" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-[var(--color-salmon)]">Failed to load KPIs</div>;
  }

  // Fallback to searching for a 'summary' object if no specific path logic is added
  const sourceData = (data.summary || data) as Record<string, unknown>;

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {definitions.map((def) => {
        const rawValue = getNestedValue(sourceData, def.key);
        const displayValue = formatValue(rawValue, def.format);
        const trend = def.trendKey ? getNestedValue(sourceData, def.trendKey) : undefined;
        const trendValue = typeof trend === 'number' ? `${trend > 0 ? '+' : ''}${trend}%` : undefined;

        return (
          <StatCard 
            key={def.label} 
            title={def.label}
            value={displayValue}
            accent={def.accent}
            trend={trendValue}
            filter={def.format === 'suffix_k' ? 'Total' : 'Avg'}
          />
        );
      })}
    </div>
  );
}