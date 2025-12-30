import React from "react";
import { BellIcon, MoonIcon, SearchIcon, SunIcon, ChatIcon } from "@/components/ui/icons";

interface TopBarProps {
  isDark: boolean;
  onToggle: () => void;
  onChatToggle?: () => void;
}

export const TopBar = ({ isDark, onToggle, onChatToggle }: TopBarProps) => (
  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex items-center gap-3">
      <button className="rounded-full bg-[var(--color-unit)] p-2 text-[color:var(--color-secondary)] shadow-card lg:hidden">
        <div className="flex h-4 w-4 flex-col justify-between">
          <span className="h-0.5 w-full bg-current" />
          <span className="h-0.5 w-full bg-current" />
          <span className="h-0.5 w-full bg-current" />
        </div>
      </button>
      <div className="relative w-full max-w-[320px]">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-secondary)]" />
        <input
          className="w-full rounded-full border border-[color:var(--color-stroke)] bg-[var(--color-unit)] py-2 pl-9 pr-4 text-sm text-[color:var(--color-primary)] placeholder:text-[color:var(--color-secondary)]"
          placeholder="Search"
        />
      </div>
    </div>
    <div className="flex items-center gap-6">
      <button
        className="rounded-full bg-[var(--color-unit)] p-2 text-[color:var(--color-secondary)] shadow-card"
        onClick={onToggle}
        aria-pressed={isDark}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        type="button"
      >
        {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>
      {onChatToggle && (
        <button
          className="rounded-full bg-[var(--color-unit)] p-2 text-[color:var(--color-secondary)] shadow-card hover:text-[var(--color-highlight)] transition-colors"
          onClick={onChatToggle}
          title="Toggle Copilot"
        >
          <ChatIcon className="h-5 w-5" />
        </button>
      )}
      <button className="relative rounded-full bg-[var(--color-unit)] p-2 text-[color:var(--color-secondary)] shadow-card">
        <BellIcon className="h-5 w-5" />
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--color-salmon)] ring-2 ring-[color:var(--color-unit)]" />
      </button>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-[color:var(--color-avatar-ring)] bg-[var(--color-soft-lavender)]" />
        <div>
          <p className="text-sm font-medium text-[color:var(--color-primary)]">Mark Ferdinand</p>
          <p className="text-[10px] text-[color:var(--color-secondary)]">mkferdinand@gmail.com</p>
        </div>
      </div>
    </div>
  </div>
);
