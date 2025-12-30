import React from "react";

interface SplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export const SplitLayout = ({ left, right }: SplitLayoutProps) => {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="w-full min-w-0">{left}</div>
      <div className="w-full min-w-0">{right}</div>
    </div>
  );
};
