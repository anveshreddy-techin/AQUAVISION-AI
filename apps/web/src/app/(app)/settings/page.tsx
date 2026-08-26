"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Shield, Sliders, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [tileSize, setTileSize] = useState(512);
  const [tileOverlap, setTileOverlap] = useState(64);
  const [confThreshold, setConfThreshold] = useState(0.25);
  const [anomalyThreshold, setAnomalyThreshold] = useState(0.5);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-cyan-400" /> Platform & Pipeline Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure survey preprocessing tiling window parameters and detection thresholds.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 p-3 text-xs text-emerald-300">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Pipeline configuration parameters updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Profile */}
        <Card className="bg-slate-900/70 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Operator Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-4 font-mono">
              <div>
                <span className="text-slate-500">Name:</span>
                <p className="text-slate-200 font-semibold mt-0.5">{user?.full_name}</p>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <p className="text-slate-200 font-semibold mt-0.5">{user?.email}</p>
              </div>
              <div>
                <span className="text-slate-500">Role:</span>
                <p className="text-cyan-400 uppercase font-semibold mt-0.5">{user?.role}</p>
              </div>
              <div>
                <span className="text-slate-500">Organization:</span>
                <p className="text-slate-200 font-semibold mt-0.5">
                  {user?.organization || "AquaVision AI Lab"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sonar Processing Parameters */}
        <Card className="bg-slate-900/70 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" /> SSS Processing Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Tiling Window Size (Pixels)
                </label>
                <Input
                  type="number"
                  value={tileSize}
                  onChange={(e) => setTileSize(Number(e.target.value))}
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Default 512x512 for SSS swaths
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Window Overlap (Pixels)
                </label>
                <Input
                  type="number"
                  value={tileOverlap}
                  onChange={(e) => setTileOverlap(Number(e.target.value))}
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Prevents missed targets at boundaries
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Detection Confidence Threshold
                </label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="0.9"
                  value={confThreshold}
                  onChange={(e) => setConfThreshold(Number(e.target.value))}
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Current: {confThreshold}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Anomaly Sensitivity Threshold
                </label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="0.9"
                  value={anomalyThreshold}
                  onChange={(e) => setAnomalyThreshold(Number(e.target.value))}
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Current: {anomalyThreshold}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold">
                Save Parameters
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
