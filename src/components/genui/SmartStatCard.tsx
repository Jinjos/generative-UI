"use client";

import React from "react";
import { useDataFetcher } from "@/hooks/useDataFetcher";
import { getNestedValue } from "@/lib/utils/object";

interface SmartStatCardProps {
  title: string;
  apiEndpoint: string;
  dataKey: string;
  filter?: string;
}

export const SmartStatCard = ({ 
  title, 
  apiEndpoint, 
  dataKey, 
  filter 
}: SmartStatCardProps) => {
  const { data, loading, error } = useDataFetcher<Record<string, unknown>>(apiEndpoint);

  const rawValue = (() => {
    let value = data ? getNestedValue(data, dataKey) : null;
    // Fallback logic for acceptance rate
    if (dataKey.toLowerCase().includes('acceptance_rate') && (value === null || value === undefined)) {
      value = data ? getNestedValue(data, 'acceptance_rate') : null;
    }
    return value;
  })();
  const numValue = rawValue !== null ? Number(rawValue) : null;
  const isPercentage = !!(
    numValue !== null && 
    !isNaN(numValue) && 
    (dataKey.toLowerCase().includes("rate") || dataKey.toLowerCase().includes("percent") || (numValue > 0 && numValue <= 1))
  );
  
  const formatValue = (val: unknown) => {
    if (val === null || val === undefined) return "...";
    const num = Number(val);
    if (isNaN(num)) return String(val);
    
    if (isPercentage) {
      return `${(num * 100).toFixed(1)}%`;
    }
    
    // Large numbers
    if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num > 1000) return `${(num / 1000).toFixed(1)}k`;

    return num.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  const value = formatValue(rawValue);

  if (error) {
    return (
      <div className="rounded-[8px] bg-red-50 p-5 border border-red-100">
        <p className="text-xs text-red-500">Error loading {title}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col justify-between h-full rounded-[12px] bg-[var(--color-unit)] p-5 shadow-card transition-all duration-300 hover:shadow-lg ${loading ? 'opacity-50' : 'opacity-100'}`}>
      
      {/* Header: Label + Action */}
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold text-[color:var(--color-secondary)] uppercase tracking-wide">
          {title}
        </p>
      </div>

      {/* Hero Value */}
      <div className="flex items-baseline gap-2 mb-4">
        <p className="text-3xl font-bold text-[color:var(--color-primary)] tracking-tight">
          {loading ? "..." : value}
        </p>
      </div>

      {/* Footer: Progress Bar (Sync'd) + Context */}
      <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
         {isPercentage && numValue !== null ? (
           <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden mr-3">
              <div 
                className="h-full bg-[var(--color-highlight)] transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min(100, Math.max(0, numValue * 100))}%` }}
              ></div>
           </div>
         ) : (
           <div className="flex-1" /> 
         )}
         
         {filter && (
          <span className="text-[10px] font-medium text-[color:var(--color-secondary)] bg-[var(--color-unit-2)] px-2 py-1 rounded-full whitespace-nowrap">
            {filter}
          </span>
         )}
      </div>
    </div>
  );
};
