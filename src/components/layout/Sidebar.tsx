import React from "react";
import Link from "next/link";
import { Chevron, Icon } from "@/components/ui/icons";

export interface NavItem {
  label: string;
  icon: string;
  active?: boolean;
  badge?: string;
  href?: string;
}

interface SidebarProps {
  navItems: NavItem[];
}

export const Sidebar = ({ navItems }: SidebarProps) => (
  <aside className="hidden w-[267px] shrink-0 bg-[var(--color-unit)] lg:block">
    <div className="flex items-center justify-between px-8 py-6">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9">
          <div className="absolute left-0 top-0 h-4 w-4 rotate-45 bg-[#5b25c0]" />
          <div className="absolute right-0 top-0 h-4 w-4 -rotate-12 bg-[#421c83]" />
          <div className="absolute bottom-0 left-0 h-4 w-4 rotate-12 bg-[var(--color-highlight)]" />
        </div>
        <span className="font-display text-xl text-[color:var(--color-primary)]">CUBIC</span>
      </div>
      <button className="rounded-full bg-[var(--color-soft-lavender)] p-2 text-[color:var(--color-highlight)]">
        <Chevron className="h-4 w-4 rotate-180" />
      </button>
    </div>

    <nav className="mt-4 space-y-2 px-4">
      {navItems.map((item) => {
        const itemColor = item.active ? "text-[color:var(--color-highlight)]" : "text-[color:var(--color-secondary)]";
        // Simple href logic: /analytics for Analytics, / for Dashboard, # for others
        const href = item.href || (item.label === "Analytics" ? "/analytics" : item.label === "Dashboard" ? "/" : "#");
        
        return (
          <Link
            key={item.label}
            href={href}
            className={`relative flex items-center gap-4 rounded-lg px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-colors ${
              item.active ? "bg-[var(--color-soft-lavender)]" : ""
            } ${itemColor}`}
          >
            <Icon name={item.icon} className="h-5 w-5" />
            <span>{item.label}</span>
            {item.badge ? (
              <span className="ml-auto rounded-full bg-[var(--color-salmon)] px-2 py-0.5 text-xs text-white">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  </aside>
);
