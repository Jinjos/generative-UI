import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for merging classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface IconProps {
  name?: string;
  className?: string;
}

export const Icon = ({ name, className }: IconProps) => {
  const common = "stroke-current fill-none";
  switch (name) {
    case "grid":
      return (
        <svg className={className} viewBox="0 0 24 24" strokeWidth="1.6">
          <rect className={common} x="3" y="3" width="7" height="7" rx="2" />
          <rect className={common} x="14" y="3" width="7" height="7" rx="2" />
          <rect className={common} x="3" y="14" width="7" height="7" rx="2" />
          <rect className={common} x="14" y="14" width="7" height="7" rx="2" />
        </svg>
      );
    case "box":
      return (
        <svg className={className} viewBox="0 0 24 24" strokeWidth="1.6">
          <path className={common} d="M3 7.5 12 3l9 4.5-9 4.5L3 7.5Z" />
          <path className={common} d="M3 7.5V17l9 4 9-4V7.5" />
          <path className={common} d="M12 12v9" />
        </svg>
      );
    case "users":
      return (
        <svg className={className} viewBox="0 0 24 24" strokeWidth="1.6">
          <circle className={common} cx="9" cy="8" r="3" />
          <circle className={common} cx="17" cy="9" r="2.5" />
          <path className={common} d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <path className={common} d="M14 18c.6-2 2.4-3.5 4.5-3.5 1.5 0 2.9.7 3.5 1.8" />
        </svg>
      );
    case "folder":
      return (
        <svg className={className} viewBox="0 0 24 24" strokeWidth="1.6">
          <path className={common} d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        </svg>
      );
    case "bag":
      return (
        <svg className={className} viewBox="0 0 24 24" strokeWidth="1.6">
          <path className={common} d="M5 7h14l-1 12H6L5 7Z" />
          <path className={common} d="M9 7V6a3 3 0 0 1 6 0v1" />
        </svg>
      );
    case "tag":
      return (
        <svg className={className} viewBox="0 0 24 24" strokeWidth="1.6">
          <path className={common} d="M3 12V6a2 2 0 0 1 2-2h6l10 10-6 6L3 12Z" />
          <circle className={common} cx="7.5" cy="7.5" r="1.5" />
        </svg>
      );
    case "chat":
      return (
        <svg className={className} viewBox="0 0 24 24" strokeWidth="1.6">
          <path className={common} d="M4 5h16v10H8l-4 4V5Z" />
          <path className={common} d="M8 9h8" />
          <path className={common} d="M8 12h6" />
        </svg>
      );
    case "settings":
      return (
        <svg className={className} viewBox="0 0 24 24" strokeWidth="1.6">
          <path className={common} d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
          <path className={common} d="M4 12a8 8 0 0 0 .2 1.8l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 3.1 1.8l.3 2.6h4l.3-2.6a8 8 0 0 0 3.1-1.8l2.4 1 2-3.4-2-1.6A8 8 0 0 0 20 12a8 8 0 0 0-.2-1.8l2-1.6-2-3.4-2.4 1a8 8 0 0 0-3.1-1.8L14 1.8h-4l-.3 2.6a8 8 0 0 0-3.1 1.8l-2.4-1-2 3.4 2 1.6A8 8 0 0 0 4 12Z" />
        </svg>
      );
    case "logout":
      return (
        <svg className={className} viewBox="0 0 24 24" strokeWidth="1.6">
          <path className={common} d="M10 4h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-4" />
          <path className={common} d="M7 12h9" />
          <path className={common} d="M10 9l-3 3 3 3" />
        </svg>
      );
    default:
      return null;
  }
};

export const Chevron = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M6 10a6 6 0 1 1 12 0v4l2 2H4l2-2v-4Z" />
    <path d="M9 18a3 3 0 0 0 6 0" />
  </svg>
);

export const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v3" />
    <path d="M12 19v3" />
    <path d="M4.9 4.9l2.1 2.1" />
    <path d="M17 17l2.1 2.1" />
    <path d="M2 12h3" />
    <path d="M19 12h3" />
    <path d="M4.9 19.1l2.1-2.1" />
    <path d="M17 7l2.1-2.1" />
  </svg>
);

export const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M20 14.5A8 8 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
  </svg>
);

export const ChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M4 5h16v10H8l-4 4V5Z" />
    <path d="M8 9h8" />
    <path d="M8 12h6" />
  </svg>
);
