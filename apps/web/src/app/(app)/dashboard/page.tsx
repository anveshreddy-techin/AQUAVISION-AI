"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { OverviewStats, Survey, Candidate } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/common/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { ModalityBadge } from "@/components/common/modality-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Ship,
  Layers,
  Scan,
  Crosshair,
  AlertOctagon,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, surveyData, candidateData] = await Promise.all([
        api.get<OverviewStats>("/analytics/overview"),
        api.get<{ surveys: Survey[]; total: number }>("/surveys"),
        api.get<{ candidates: Candidate[]; total: number }>("/candidates"),
      ]);
      setStats(overviewData);
      setSurveys(surveyData.surveys || []);
      setCandidates(candidateData.candidates || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading Mission Intelligence..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  // Priority chart data
  const priorityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  candidates.forEach((c) => {
    if (priorityCounts[c.priority_category] !== undefined) {
      priorityCounts[c.priority_category]++;
    }
  });

  const priorityChartData = [
    { name: "Critical", value: priorityCounts.CRITICAL, color: "#dc2626" },
    { name: "High", value: priorityCounts.HIGH, color: "#ea580c" },
    { name: "Medium", value: priorityCounts.MEDIUM, color: "#ca8a04" },
    { name: "Low", value: priorityCounts.LOW, color: "#16a34a" },
  ].filter((d) => d.value > 0);

  // Review status chart data
  const statusCounts = { PENDING: 0, ACCEPTED: 0, REJECTED: 0, CORRECTED: 0, UNCERTAIN: 0 };
  candidates.forEach((c) => {
    if (statusCounts[c.status as keyof typeof statusCounts] !== undefined) {
      statusCounts[c.status as keyof typeof statusCounts]++;
    }
  });

  const reviewChartData = [
    { name: "Pending", count: statusCounts.PENDING, fill: "#475569" },
    { name: "Accepted", count: statusCounts.ACCEPTED, fill: "#059669" },
    { name: "Rejected", count: statusCounts.REJECTED, fill: "#e11d48" },
    { name: "Corrected", count: statusCounts.CORRECTED, fill: "#6366f1" },
    { name: "Uncertain", count: statusCounts.UNCERTAIN, fill: "#d97706" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Mission Operations Dashboard
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-400 font-mono">
              SSS SCREENING ACTIVE
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated Side-Scan Sonar survey screening, anomaly ranking & prioritized verification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <a href="/review">
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 gap-1.5 text-xs">
              <ClipboardList className="h-3.5 w-3.5" /> Start Review Queue
            </Button>
          </a>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="p-3 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Active Surveys</span>
            <Ship className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{stats?.active_surveys ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Surveys in queue</div>
        </Card>

        <Card className="p-3 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Total Frames</span>
            <Layers className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{stats?.total_frames ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ingested sonar frames</div>
        </Card>

        <Card className="p-3 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Screened</span>
            <Scan className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400">{stats?.frames_screened ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Processed by pipeline</div>
        </Card>

        <Card className="p-3 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Candidates</span>
            <Crosshair className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{stats?.total_candidates ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Generated detections</div>
        </Card>

        <Card className="p-3 bg-slate-900/60 border-red-900/40">
          <div className="flex items-center justify-between text-red-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">High Priority</span>
            <AlertOctagon className="h-3.5 w-3.5 text-red-400 animate-pulse" />
          </div>
          <div className="text-xl font-bold text-red-400">{stats?.high_priority_candidates ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Critical + High score</div>
        </Card>

        <Card className="p-3 bg-slate-900/60 border-amber-900/40">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Anomalies</span>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">{stats?.total_anomalies ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Variance flags</div>
        </Card>

        <Card className="p-3 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Pending</span>
            <ClipboardList className="h-3.5 w-3.5 text-yellow-400" />
          </div>
          <div className="text-xl font-bold text-yellow-400">{stats?.pending_reviews ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Awaiting human review</div>
        </Card>

        <Card className="p-3 bg-slate-900/60 border-emerald-900/40">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Completed</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">{stats?.completed_reviews ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Verified decisions</div>
        </Card>
      </div>

      {/* Charts & Operational Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              Candidate Priority Distribution
              <span className="text-[10px] font-mono text-slate-500">RANKING ENGINE</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-56 flex flex-col justify-center">
            {priorityChartData.length === 0 ? (
              <p className="text-xs text-slate-500 text-center">No candidates available</p>
            ) : (
              <div className="flex items-center justify-between">
                <div className="w-1/2 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {priorityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2 text-xs">
                  {priorityChartData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between pr-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-300">{d.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-100">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Status Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              Human Review Verification Status
              <span className="text-[10px] font-mono text-slate-500">HUMAN-IN-THE-LOOP</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reviewChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Surveys Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              Active Surveys
              <a href="/surveys" className="text-[11px] text-cyan-400 hover:underline">
                View all ({surveys.length})
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {surveys.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No surveys found</p>
            ) : (
              surveys.slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <a
                      href={`/surveys/${s.id}`}
                      className="text-xs font-semibold text-slate-200 hover:text-cyan-400 truncate max-w-[150px]"
                    >
                      {s.name}
                    </a>
                    <div className="flex items-center gap-1.5">
                      <ModalityBadge modality={s.sonar_modality} />
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      {s.processed_frames} / {s.total_frames} frames
                    </span>
                    <span>{s.is_demo ? "DEMO SYNTHETIC" : "FIELD ACQUISITION"}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical Candidates Alert Section */}
      <Card className="border-red-900/40 bg-red-950/10">
        <CardHeader className="py-3 px-4 border-b border-red-900/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-red-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-300">
              High Priority Candidates Requiring Immediate Review
            </span>
          </div>
          <a href="/review">
            <Button size="sm" variant="outline" className="h-7 text-xs border-red-800/60 text-red-300 hover:bg-red-950/50">
              Open Full Review Queue <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </a>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {candidates
              .filter((c) => c.priority_category === "CRITICAL" || c.priority_category === "HIGH")
              .slice(0, 3)
              .map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">Candidate #{c.id}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800/60">
                        SCORE: {c.priority_score.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{c.object_class || "Anomaly"}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Conf: {c.confidence ? `${(c.confidence * 100).toFixed(0)}%` : "N/A"} • Anom:{" "}
                      {c.anomaly_score ? c.anomaly_score.toFixed(2) : "N/A"}
                    </p>
                  </div>
                  <div className="pt-3 mt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <StatusBadge status={c.status} />
                    <a href={`/review?candidate_id=${c.id}`}>
                      <Button size="sm" variant="ghost" className="h-6 text-[11px] text-cyan-400 p-0">
                        Inspect →
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
