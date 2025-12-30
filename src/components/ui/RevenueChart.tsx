import React from "react";

const buildPath = (values: number[], width: number, height: number) => {
  const maxValue = Math.max(...values) || 1;
  const step = width / (values.length - 1);
  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - (value / maxValue) * height;
    return [x, y] as [number, number];
  });

  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `M0,${height} L${line} L${width},${height} Z`;

  return { line, area, points };
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface RevenueChartProps {
  revenueData?: number[];
  expenseData?: number[];
}

export const RevenueChart = ({ 
  revenueData = [2.1, 2.8, 2.2, 6.7, 3.1, 2.6, 1.7, 7.2, 6.3, 8.1, 4.9, 7.6],
  expenseData = [0.6, 1.9, 3.4, 3.9, 4.6, 4.2, 4.9, 5.2, 5.1, 5.4, 5.7, 6.1]
}: RevenueChartProps) => {
  const width = 560;
  const height = 180;
  const revenuePath = buildPath(revenueData, width, height);
  const expensePath = buildPath(expenseData, width, height);
  const markerIndex = 3;
  const markerPoint = revenuePath.points[markerIndex];

  return (
    <div className="rounded-[8px] bg-[var(--color-unit)] p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-[color:var(--color-primary)]">Revenue analytics</p>
          <div className="mt-2 flex items-center gap-4 text-xs text-[color:var(--color-secondary)]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--color-chart-1)]" /> Revenue
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--color-chart-2)]" /> Expenses
            </span>
          </div>
        </div>
        <button className="rounded-full bg-[var(--color-bg)] px-3 py-1 text-xs text-[color:var(--color-secondary)]">
          Year
        </button>
      </div>

      <div className="relative mt-6">
        <div className="pointer-events-none absolute left-0 top-0 flex h-full w-full flex-col justify-between text-xs text-[color:var(--color-secondary)]">
          {["$8k", "$6k", "$4k", "$2k", "$0"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="ml-10">
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
              <line
                key={ratio}
                x1="0"
                y1={height * ratio}
                x2={width}
                y2={height * ratio}
                stroke="var(--color-grid)"
                strokeDasharray="4 4"
              />
            ))}
            <path d={revenuePath.area} fill="url(#revenueFill)" />
            <path d={expensePath.area} fill="url(#expenseFill)" />
            <polyline points={revenuePath.line} fill="none" stroke="var(--color-chart-1)" strokeWidth="2" />
            <polyline points={expensePath.line} fill="none" stroke="var(--color-chart-2)" strokeWidth="2" />
            <circle cx={markerPoint[0]} cy={markerPoint[1]} r="5" fill="var(--color-chart-1)" />
          </svg>
          <div
            className="absolute -top-4 rounded-full bg-[var(--color-chart-1)] px-2 py-1 text-xs text-white"
            style={{ left: `${markerPoint[0] + 30}px` }}
          >
            $6,700
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--color-secondary)]">
            {months.map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
