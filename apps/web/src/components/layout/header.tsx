"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Bell, LogOut, ShieldCheck, UserCircle, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { NotificationItem } from "@/lib/types";

export function Header() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const list = await api.get<NotificationItem[]>("/notifications");
        setNotifications(list);
      } catch {}
    };
    fetchNotifs();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-6 backdrop-blur-md z-20">
      {/* Left side title / status badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-slate-300 text-[11px]">MISSION CONTROL ACTIVE</span>
        </div>
        <span className="text-xs text-slate-500 font-mono hidden md:inline">
          SSS PREPROCESSING: CLAHE+NLMEANS
        </span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-slate-950">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-semibold text-slate-200">Mission Notifications</span>
                <span className="text-[10px] text-slate-400">{unreadCount} unread</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-3">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-left text-xs"
                    >
                      <p className="font-semibold text-slate-200">{n.title}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <div className="flex flex-col text-right">
            <span className="text-xs font-medium text-slate-200">{user?.full_name || "Operator"}</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">
              {user?.role || "Researcher"}
            </span>
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-slate-400 hover:bg-red-950/50 hover:text-red-300 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
