"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Candidate } from "@/lib/types";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles, Activity, Filter } from "lucide-react";

export default function AnomaliesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0.4);

  const fetchAnomalies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ candidates: Candidate[]; total: number }>("/candidates");
      setCandidates(res.candidates || []);
    } catch (err: any) {
      setError(err.message || "Failed to load anomaly telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const anomalyCandidates = candidates.filter(
    (c) => (c.anomaly_score || 0) >= minScore || c.candidate_type === "ANOMALY"
  );

  if (loading) return <LoadingState message="Scanning Acoustic Anomaly Telemetry..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAnomalies} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" /> Acoustic Anomaly Telemetry Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Unsupervised seabed texture deviations, acoustic shadow anomalies, and structural outliers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">Min Anomaly Threshold:</span>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-100"
          >
            <option value={0.2}>&gt; 0.20 (Sensitive)</option>
            <option value={0.4}>&gt; 0.40 (Standard)</option>
            <option value={0.6}>&gt; 0.60 (High)</option>
            <option value={0.8}>&gt; 0.80 (Extreme)</option>
          </select>
        </div>
      </div>

      {anomalyCandidates.length === 0 ? (
        <EmptyState
          title="No anomalies above threshold"
          description="Try lowering the sensitivity threshold or run a survey through the anomaly pipeline."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {anomalyCandidates.map((c) => (
            <Card key={c.id} className="border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200">
                  Anomaly #{c.id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  SCORE: {c.anomaly_score ? c.anomaly_score.toFixed(2) : "0.50"}
                </span>
              </div>

              {/* Simulated Thermal / Anomaly Heatmap Visual */}
              <div className="h-32 rounded-lg bg-slate-950 border border-slate-800 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:12px_12px]" />
                <div className="w-20 h-20 rounded-full bg-radial from-amber-500/70 via-red-500/30 to-transparent blur-md" />
                <span className="text-[10px] font-mono text-amber-300 z-10 bg-slate-950/70 px-2 py-0.5 rounded border border-amber-900/60">
                  DEVIATION DETECTED
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-mono text-[11px] text-slate-400">
                  <span>Classification:</span>
                  <span className="text-slate-200">{c.object_class || "Seabed Outlier"}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px] text-slate-400">
                  <span>Priority Category:</span>
                  <span className="text-cyan-400 font-bold">{c.priority_category}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <StatusBadge status={c.status} />
                <a href={`/review?candidate_id=${c.id}`}>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-cyan-400">
                    Verify Anomaly →
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
