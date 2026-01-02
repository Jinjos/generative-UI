"use client";

import React from "react";
import { useDataFetcher } from "@/hooks/useDataFetcher";
import { getNestedValue } from "@/lib/utils/object";
import { Chevron } from "@/components/ui/icons";

interface ColumnDefinition {
  key: string;
  label: string;
  format?: "date" | "currency" | "status" | "percentage" | "number";
}

interface SmartTableProps {
  apiEndpoint: string;
  title: string;
  columns: ColumnDefinition[];
}

interface TableDataResponse {
  items?: Record<string, unknown>[];
  trends?: Record<string, unknown>[];
  [key: string]: unknown;
}

const formatCell = (val: unknown, format?: string, columnKey?: string) => {
  if (val === undefined || val === null) return "-";
  
  // Auto-detect percentage based on key name or value range
  const isPercentage = format === "percentage" || 
                       (columnKey?.toLowerCase().includes("rate")) || 
                       (columnKey?.toLowerCase().includes("efficiency"));

  if (isPercentage) {
    const num = Number(val);
    return isNaN(num) ? String(val) : `${(num * 100).toFixed(1)}%`;
  }

  if (format === "date") {
    const d = new Date(val as string | number | Date);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString();
  }

  if (format === "currency") return typeof val === 'number' ? `$${val.toLocaleString()}` : String(val);

  if (format === "number" || typeof val === 'number') {
    const num = Number(val);
    return isNaN(num) ? String(val) : num.toLocaleString();
  }

  if (format === "status") {
    // Simple status chip logic
    return (
      <span className="flex items-center gap-2">
         <span className={`h-2 w-2 rounded-full ${val === 'Pending' ? 'bg-[var(--color-yellow)]' : 'bg-[var(--color-green)]'}`} />
         {String(val)}
      </span>
    );
  }
  return String(val);
};

export function SmartTable({ apiEndpoint, title, columns }: SmartTableProps) {
  const { data, loading, error } = useDataFetcher<TableDataResponse | Record<string, unknown>[]>(apiEndpoint);

  if (loading) {
    return (
      <div className="rounded-[8px] bg-[var(--color-unit)] p-6 shadow-card h-[300px] animate-pulse" />
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[8px] bg-[var(--color-unit)] p-6 shadow-card text-[var(--color-salmon)]">
        Failed to load table data
      </div>
    );
  }

  // Fallback: Try to find an array in the response
  const rows = (Array.isArray(data) 
    ? data 
    : (data.items || data.trends || [])) as Record<string, unknown>[];

  if (rows.length === 0) {
    return (
      <div className="rounded-[8px] bg-[var(--color-unit)] p-6 shadow-card text-[var(--color-secondary)]">
        No records found.
      </div>
    );
  }

  return (
    <div className="rounded-[8px] bg-[var(--color-unit)] p-6 shadow-card">
      <p className="text-lg font-medium text-[color:var(--color-primary)]">{title}</p>
      <div className="mt-4 overflow-hidden rounded-b-[8px] overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-unit-2)] text-[color:var(--color-secondary)]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-normal whitespace-nowrap">{col.label}</th>
              ))}
              <th className="px-4 py-3 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[color:var(--color-stroke)] hover:bg-[var(--color-bg)] transition-colors">
                {columns.map((col) => (
                  <td key={`${i}-${col.key}`} className="px-4 py-3 text-[color:var(--color-primary)] whitespace-nowrap">
                    {formatCell(getNestedValue(row, col.key), col.format, col.key)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-[color:var(--color-secondary)]">
                  <Chevron className="h-4 w-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
