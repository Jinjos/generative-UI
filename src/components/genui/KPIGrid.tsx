"use client";

import React from "react";
import { useDataFetcher } from "@/hooks/useDataFetcher";
import { getNestedValue } from "@/lib/utils/object";
import { StatCard } from "@/components/ui/StatCard";
import { useBeacon } from "@/components/genui/BeaconProvider";

interface KPIDefinition {
  key: string;
  label: string;
  format?: "number" | "currency" | "suffix_k";
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
  const { registerView, unregisterView } = useBeacon();
  const id = React.useId();
  const { data, loading, error } = useDataFetcher<KPIDataResponse>(apiEndpoint);

  const sourceData = (data?.summary || data || {}) as Record<string, unknown>;
  const kpiValues = definitions.map((def) => {
    let rawValue = getNestedValue(sourceData, def.key);
    if (def.key.toLowerCase().includes('acceptance_rate') && (rawValue === null || rawValue === undefined)) {
      rawValue = getNestedValue(sourceData, 'acceptance_rate');
    }
    return {
      key: def.key,
      label: def.label,
      format: def.format,
      rawValue,
      displayValue: formatValue(rawValue, def.format)
    };
  });

  React.useEffect(() => {
    const queryString = apiEndpoint.split("?")[1] || "";
    const params = new URLSearchParams(queryString);
    const paramsObj: Record<string, string> = {};
    params.forEach((value, key) => { paramsObj[key] = value; });

    const hasValue = !loading && !error;

    registerView({
      id,
      component: "KPIGrid",
      description: `KPI grid: ${definitions.map((def) => def.label).join(", ")}`,
      endpoint: apiEndpoint,
      params: {
        ...paramsObj,
        definitions: definitions.map((def) => ({
          key: def.key,
          label: def.label,
          format: def.format
        })),
        values: hasValue ? kpiValues : undefined
      }
    });

    return () => unregisterView(id);
  }, [id, apiEndpoint, definitions, kpiValues, loading, error, registerView, unregisterView]);

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

  // Calculate gridCols based on definitions.length
  const kpiCount = definitions.length;
  const gridCols = 
    kpiCount === 4 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' :
    kpiCount === 3 ? 'grid-cols-1 md:grid-cols-3' :
    kpiCount === 2 ? 'grid-cols-1 md:grid-cols-2' : 
    'grid-cols-1';

  return (
    <div className={`grid gap-6 ${gridCols}`}>
      {kpiValues.map((item) => (
        <StatCard 
          key={item.label} 
          title={item.label}
          value={item.displayValue}
          filter={item.format === 'suffix_k' ? 'Total' : 'Avg'}
        />
      ))}
    </div>
  );
}
