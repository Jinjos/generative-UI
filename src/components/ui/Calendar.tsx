import React from "react";
import { Chevron } from "@/components/ui/icons";

export interface CalendarItem {
  title: string;
  time: string;
  color: string;
}

interface CalendarProps {
  items: CalendarItem[];
}

export const Calendar = ({ items }: CalendarProps) => (
  <div className="rounded-[8px] bg-[var(--color-unit)] p-6 shadow-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-lg font-medium text-[color:var(--color-primary)]">Calendar</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-[color:var(--color-secondary)]">
          <span>Aug 10, Mon</span>
          <span className="rounded-full bg-[var(--color-unit-2)] px-2 py-0.5 text-[10px] text-[color:var(--color-primary)]">
            TODAY
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[color:var(--color-secondary)]">
        <button className="flex h-7 w-7 items-center justify-center rounded border border-[color:var(--color-stroke)]">
          <Chevron className="h-4 w-4 rotate-180" />
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded border border-[color:var(--color-stroke)]">
          <Chevron className="h-4 w-4" />
        </button>
      </div>
    </div>

    <div className="mt-6 space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item.title}-${index}`}
          className="relative rounded border border-[color:var(--color-stroke)] bg-[var(--color-unit)] px-4 py-3"
        >
          <div
            className="absolute left-0 top-0 h-full w-1 rounded-l"
            style={{ backgroundColor: item.color }}
          />
          <p className="text-sm text-[color:var(--color-primary)]">{item.title}</p>
          <p className="text-xs text-[color:var(--color-secondary)]">{item.time}</p>
        </div>
      ))}
    </div>

    <button className="mt-5 flex items-center gap-1 text-sm text-[color:var(--color-highlight)]">
      See full calendar <Chevron className="h-4 w-4" />
    </button>
  </div>
);
