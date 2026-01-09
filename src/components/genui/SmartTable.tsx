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
  data?: Record<string, unknown>[]; // Pagination envelope
  pagination?: {
    total: number;
    skip: number;
    limit: number;
  };
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
  const [page, setPage] = React.useState(1);
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  // Append pagination params if not already present
  const paginatedUrl = apiEndpoint.includes('?') 
    ? `${apiEndpoint}&skip=${skip}&limit=${pageSize}` 
    : `${apiEndpoint}?skip=${skip}&limit=${pageSize}`;

  const { data, loading, error } = useDataFetcher<TableDataResponse | Record<string, unknown>[]>(paginatedUrl);

  // Extract Data & Metadata
  let rows: Record<string, unknown>[] = [];
  let totalCount = 0;

  if (data) {
    if (Array.isArray(data)) {
      rows = data; // Legacy/Flat array
      totalCount = data.length;
    } else {
      // Prioritize 'data' from envelope, then fallbacks
      rows = (data.data || data.items || data.trends || []) as Record<string, unknown>[];
      totalCount = data.pagination?.total || rows.length;
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize);
  const showPagination = totalCount > pageSize || (data && !Array.isArray(data) && !!data.pagination);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => (totalPages ? Math.min(totalPages, p + 1) : p + 1));

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

  if (rows.length === 0) {
    return (
      <div className="rounded-[8px] bg-[var(--color-unit)] p-6 shadow-card text-[var(--color-secondary)]">
        <p className="text-lg font-medium text-[color:var(--color-primary)] mb-4">{title}</p>
        <p>No records found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[8px] bg-[var(--color-unit)] p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-lg font-medium text-[color:var(--color-primary)]">{title}</p>
        {showPagination && (
          <span className="text-xs text-[color:var(--color-secondary)]">
            Showing {skip + 1}-{Math.min(skip + rows.length, totalCount)} of {totalCount}
          </span>
        )}
      </div>
      
      <div className="overflow-hidden rounded-b-[8px] overflow-x-auto border border-[color:var(--color-stroke)] rounded-lg">
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
              <tr key={i} className="border-b border-[color:var(--color-stroke)] hover:bg-[var(--color-bg)] transition-colors last:border-0">
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

      {showPagination && (
        <div className="flex items-center justify-between mt-4 pt-2 border-t border-[color:var(--color-stroke)]">
          <button 
            onClick={handlePrev} 
            disabled={page === 1}
            className="px-3 py-1 text-xs font-medium rounded-md border border-[color:var(--color-stroke)] text-[color:var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-bg)] transition-colors"
          >
            Previous
          </button>
          
          <span className="text-xs text-[color:var(--color-secondary)]">
            Page {page} of {totalPages || 1}
          </span>

          <button 
            onClick={handleNext} 
            disabled={page >= totalPages}
            className="px-3 py-1 text-xs font-medium rounded-md border border-[color:var(--color-stroke)] text-[color:var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-bg)] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
