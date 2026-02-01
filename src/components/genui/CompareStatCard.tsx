"use client";

import React from "react";
import { useDataFetcher } from "@/hooks/useDataFetcher";
import { useBeacon } from "@/components/genui/BeaconProvider";

interface CompareStatCardProps {
  title: string;
  apiEndpoint: string; // Should be /api/metrics/compare/summary with params
  filter?: string;
}

interface CompareResponse {
  metric: string;
  gap: number;
  entityA: { label: string; value: number; isHigher: boolean };
  entityB: { label: string; value: number; isHigher: boolean };
}

export const CompareStatCard = ({ title, apiEndpoint, filter }: CompareStatCardProps) => {
  const { registerView, unregisterView } = useBeacon();
  const id = React.useId();
  const { data, loading, error } = useDataFetcher<CompareResponse>(apiEndpoint);

  React.useEffect(() => {
    const queryString = apiEndpoint.split("?")[1] || "";
    const params = new URLSearchParams(queryString);
    const paramsObj: Record<string, string> = {};
    params.forEach((value, key) => { paramsObj[key] = value; });

    const hasValue = !loading && !error;

    registerView({
      id,
      component: "CompareStatCard",
      title,
      description: "Comparison stat card",
      endpoint: apiEndpoint,
      params: {
        ...paramsObj,
        filter,
        comparison: hasValue ? {
          metric: data?.metric,
          gap: data?.gap,
          entityA: data?.entityA,
          entityB: data?.entityB
        } : undefined
      }
    });

    return () => unregisterView(id);
  }, [id, apiEndpoint, title, filter, data, loading, error, registerView, unregisterView]);

  const isRate = data?.metric === "acceptance_rate";

  const formatSubValue = (val: number) => {
    if (isRate) {
      return `${(val * 100).toFixed(1)}%`;
    }
    if (val > 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val > 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toLocaleString();
  };

  if (error) {
    return (
      <div className="rounded-[12px] bg-red-50 p-5 border border-red-100">
        <p className="text-xs text-red-500">Error loading comparison</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col justify-between h-full rounded-[12px] bg-[var(--color-unit)] p-5 shadow-card transition-all duration-300 hover:shadow-lg ${loading ? 'opacity-50' : 'opacity-100'}`}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold text-[color:var(--color-secondary)] uppercase tracking-wide">
          {title} Gap
        </p>
      </div>

      {/* Main Gap Value */}
      <div className="flex items-baseline gap-2 mb-4">
        <p className="text-3xl font-bold text-[color:var(--color-primary)] tracking-tight">
          {loading ? "..." : (data ? `${data.gap}%` : "0%") }
        </p>
        <span className="text-xs text-[color:var(--color-secondary)] font-medium uppercase">difference</span>
      </div>

      {/* Breakdown Rows */}
      <div className="space-y-2 mt-2 border-t border-gray-50 pt-3">
        {[data?.entityA, data?.entityB].map((entity, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-[color:var(--color-secondary)] truncate max-w-[120px]">
              {loading ? "..." : entity?.label}
            </span>
            <span className={`font-semibold ${
              loading ? 'text-gray-300' : 
              entity?.isHigher ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-salmon)]'
            }`}>
              {loading ? "--" : formatSubValue(entity?.value || 0)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-end">
         {filter && (
          <span className="text-[10px] font-medium text-[color:var(--color-secondary)] bg-[var(--color-unit-2)] px-2 py-1 rounded-full">
            {filter}
          </span>
         )}
      </div>
    </div>
  );
};
