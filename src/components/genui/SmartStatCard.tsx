"use client";

import React from "react";
import { Chevron } from "@/components/ui/icons";
import { useDataFetcher } from "@/hooks/useDataFetcher";
import { getNestedValue } from "@/lib/utils/object";

interface SmartStatCardProps {
  title: string;
  apiEndpoint: string;
  dataKey: string;
  accent: string;
  trendKey?: string;
  filter?: string;
}

export const SmartStatCard = ({ 
  title, 
  apiEndpoint, 
  dataKey, 
  accent, 
  trendKey, 
  filter 
}: SmartStatCardProps) => {
  const { data, loading, error } = useDataFetcher<Record<string, unknown>>(apiEndpoint);

  const rawValue = data ? getNestedValue(data, dataKey) : null;
  
  const formatValue = (val: unknown) => {
    if (val === null || val === undefined) return "...";
    const num = Number(val);
    if (isNaN(num)) return String(val);
    
    // If the dataKey suggests a rate or the number is a small decimal, format as %
    if (dataKey.includes("rate") || (num > 0 && num < 1)) {
      return `${(num * 100).toFixed(1)}%`;
    }
    
    return num.toLocaleString();
  };

  const value = formatValue(rawValue);
  const trend = trendKey && data ? String(getNestedValue(data, trendKey) ?? "") : null;

  if (error) {
    return (
      <div className="rounded-[8px] bg-red-50 p-5 border border-red-100">
        <p className="text-xs text-red-500">Error loading {title}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-[8px] bg-[var(--color-unit)] p-5 shadow-card transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: `${accent}1A`, color: accent }}
          >
            <div className="h-5 w-5 rounded-full border-2 border-current" />
          </div>
          <div>
            <p className="text-sm text-[color:var(--color-secondary)]">{title}</p>
            <p className="text-xl font-medium text-[color:var(--color-primary)]">
              {loading ? "..." : value}
            </p>
          </div>
        </div>
        {trend ? (
          <span className="rounded-full bg-[var(--color-success-bg)] px-2 py-1 text-xs text-[color:var(--color-success)]">
            {trend}
          </span>
        ) : filter ? (
          <span className="rounded-full bg-[var(--color-unit-2)] px-2 py-1 text-xs text-[color:var(--color-secondary)]">
            {filter}
          </span>
        ) : null}
      </div>
      <button className="mt-4 flex items-center gap-1 text-sm text-[color:var(--color-highlight)]">
        View All <Chevron className="h-4 w-4" />
      </button>
    </div>
  );
};
