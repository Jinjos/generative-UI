"use client";

import React from "react";

export default function RoomsPage() {
  return (
    <div className="h-full bg-[var(--color-unit)] p-6 rounded-xl shadow-sm border border-[color:var(--color-stroke)] flex flex-col items-center justify-center text-center min-h-[600px]">
      <div className="w-16 h-16 bg-[var(--color-soft-lavender)] rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">🤝</span>
      </div>
      <h3 className="text-lg font-semibold text-[color:var(--color-primary)]">Meeting Rooms</h3>
      <p className="text-[color:var(--color-secondary)] mt-2 max-w-sm text-sm">
        Collaborative workspace coming soon.
        <br/>
        <span className="text-xs text-[color:var(--color-secondary)] opacity-70 mt-2 block italic">Start a session to build dashboards with your team.</span>
      </p>
    </div>
  );
}
