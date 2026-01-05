"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDataFetcher } from "@/hooks/useDataFetcher";

interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

interface SmartChartProps {
  apiEndpoint: string;
  title: string;
  filter?: string;
  xAxisKey?: string;
  series?: ChartSeries[];
}

interface ChartApiResponse {
  trends?: Array<Record<string, number | string>>;
  [key: string]: unknown;
}

export function SmartChart({ 
  apiEndpoint, 
  title, 
  filter,
  xAxisKey = "date",
  series = [
    { key: "estimated_hours_saved", label: "Hours Saved", color: "var(--color-chart-1)" },
    { key: "active_users", label: "Active Users", color: "var(--color-chart-2)" }
  ] 
}: SmartChartProps) {
  // We use unknown first to handle the dynamic nature, then cast specific fields
  const { data, loading, error } = useDataFetcher<ChartApiResponse | Array<Record<string, unknown>>>(apiEndpoint);

  if (loading) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-[8px] bg-[var(--color-unit)] shadow-card">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-[8px] bg-[var(--color-unit)] shadow-card text-[var(--color-salmon)]">
        Error loading data
      </div>
    );
  }

  // Robustly extract the array data
  const chartData = Array.isArray(data) 
    ? data 
    : (data.trends || []);

  return (
    <div className="rounded-[8px] bg-[var(--color-unit)] p-6 shadow-card h-[340px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-lg font-medium text-[color:var(--color-primary)]">{title}</p>
          <div className="mt-2 flex items-center gap-4 text-xs text-[color:var(--color-secondary)]">
            {series.map((s) => (
              <span key={s.key} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} /> {s.label}
              </span>
            ))}
          </div>
        </div>
        <button className="rounded-full bg-[var(--color-bg)] px-3 py-1 text-xs text-[color:var(--color-secondary)]">
          {filter || "Period"}
        </button>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {series.map((s) => {
                const safeId = `gradient-${s.key.replace(/\s+/g, "-")}`;
                return (
                  <linearGradient key={s.key} id={safeId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-grid)" />
            <XAxis 
              dataKey={xAxisKey}
              tickFormatter={(val) => {
                if (!val) return "";
                // Handle YYYY-MM-DD
                const parts = String(val).split("-");
                if (parts.length === 3) {
                  return `${parts[2]}/${parts[1]}`;
                }
                const d = new Date(val);
                return isNaN(d.getTime()) ? val : `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
              }}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-secondary)", fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-secondary)", fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "var(--color-unit)", 
                borderColor: "var(--color-stroke)", 
                borderRadius: "8px",
                color: "var(--color-primary)"
              }}
              itemStyle={{ color: "var(--color-primary)" }}
            />
            {series.map((s) => (
              <Area 
                key={s.key}
                type="monotone" 
                dataKey={s.key} 
                stroke={s.color}
                fillOpacity={1} 
                fill={`url(#gradient-${s.key.replace(/\s+/g, "-")})`} 
                strokeWidth={2}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}