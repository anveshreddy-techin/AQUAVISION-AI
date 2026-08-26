"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Ship,
  Microscope,
  ClipboardCheck,
  AlertTriangle,
  Compass,
  BarChart3,
  FileText,
  Brain,
  Database,
  Settings,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  Waves,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Surveys", href: "/surveys", icon: Ship },
  { label: "Analysis Workspace", href: "/analysis", icon: Microscope },
  { label: "Review Queue", href: "/review", icon: ClipboardCheck },
  { label: "Anomalies", href: "/anomalies", icon: AlertTriangle },
  { label: "Survey Map", href: "/map", icon: Compass },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "AI Models", href: "/models", icon: Brain },
  { label: "Datasets", href: "/datasets", icon: Database },
  { label: "Settings", href: "/settings", icon: Settings },
];

const adminNavItems: NavItem[] = [
  { label: "User Management", href: "/admin/users", icon: Users, adminOnly: true },
  { label: "Audit Logs", href: "/admin/audit", icon: Shield, adminOnly: true },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleNavClick = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      {/* Brand Header */}
      <div>
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
          <Link href="/dashboard" onClick={handleNavClick} className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Waves className="h-5 w-5 animate-pulse" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-white text-sm">
                  AquaVision <span className="text-cyan-400">AI</span>
                </span>
                <span className="text-[10px] text-cyan-500/80 font-mono tracking-wider">
                  SIH26057 • SSS ENGINE
                </span>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-200 lg:hidden"
              title="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <div className="overflow-y-auto py-4 px-2 space-y-1 max-h-[calc(100vh-8rem)]">
          <div className="px-2 mb-2">
            {(!collapsed || mobileOpen) && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Operations
              </span>
            )}
          </div>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all group",
                  isActive
                    ? "bg-cyan-950/70 text-cyan-300 border border-cyan-700/50 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="px-2 pt-4 pb-1">
                {(!collapsed || mobileOpen) && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Administration
                  </span>
                )}
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all group",
                      isActive
                        ? "bg-cyan-950/70 text-cyan-300 border border-cyan-700/50"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    )}
                    title={collapsed && !mobileOpen ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                        isActive ? "text-cyan-400" : "text-slate-400"
                      )}
                    />
                    {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Collapse button on desktop */}
      <div className="hidden lg:block p-2 border-t border-slate-800/80">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on lg+) */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-slate-800/80 bg-slate-950/90 backdrop-blur-md transition-all duration-300 z-30 shrink-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible when mobileOpen is true) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-800 shadow-2xl z-50 flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
