import React from "react";
import { Chevron } from "@/components/ui/icons";

export interface StatCardProps {
  title: string;
  value: string;
  filter?: string;
}

export const StatCard = ({ title, value, filter }: StatCardProps) => (
  <div className="rounded-[8px] bg-[var(--color-unit)] p-5 shadow-card">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-bg)] text-[color:var(--color-primary)]">
          <div className="h-5 w-5 rounded-full border-2 border-current" />
        </div>
        <div>
          <p className="text-sm text-[color:var(--color-secondary)]">{title}</p>
          <p className="text-xl font-medium text-[color:var(--color-primary)]">{value}</p>
        </div>
      </div>
      {filter && (
        <span className="rounded-full bg-[var(--color-unit-2)] px-2 py-1 text-xs text-[color:var(--color-secondary)]">
          {filter}
        </span>
      )}
    </div>
    <button className="mt-4 flex items-center gap-1 text-sm text-[color:var(--color-highlight)]">
      View All <Chevron className="h-4 w-4" />
    </button>
  </div>
);
