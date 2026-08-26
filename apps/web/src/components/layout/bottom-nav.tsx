"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Ship,
  Microscope,
  ClipboardCheck,
  Compass,
} from "lucide-react";

const mobileTabs = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Surveys", href: "/surveys", icon: Ship },
  { label: "Analysis", href: "/analysis", icon: Microscope },
  { label: "Review", href: "/review", icon: ClipboardCheck },
  { label: "Map", href: "/map", icon: Compass },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-800 bg-slate-950/95 px-2 backdrop-blur-lg lg:hidden">
      {mobileTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-lg py-1 px-3 text-[10px] font-medium transition-colors",
              isActive
                ? "text-cyan-400"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                isActive ? "bg-cyan-950/80 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]" : ""
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-cyan-400" : "text-slate-400")} />
            </div>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
