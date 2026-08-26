"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/common/loading-state";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, CheckCircle, ShieldAlert, Cpu } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function AnalyticsPage() {
  const [candidateAnalytics, setCandidateAnalytics] = useState<any>(null);
  const [reviewAnalytics, setReviewAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [candData, revData] = await Promise.all([
          api.get<any>("/analytics/candidates"),
          api.get<any>("/analytics/reviews"),
        ]);
        setCandidateAnalytics(candData);
        setReviewAnalytics(revData);
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingState message="Aggregating Mission Analytics..." />;
  if (error) return <ErrorState message={error} />;

  // Transform class distribution
  const classData = candidateAnalytics?.class_distribution
    ? Object.entries(candidateAnalytics.class_distribution).map(([name, count]) => ({
        name,
        count,
      }))
    : [];

  const priorityData = candidateAnalytics?.priority_distribution
    ? [
        { name: "Critical", value: candidateAnalytics.priority_distribution.CRITICAL || 0, color: "#dc2626" },
        { name: "High", value: candidateAnalytics.priority_distribution.HIGH || 0, color: "#ea580c" },
        { name: "Medium", value: candidateAnalytics.priority_distribution.MEDIUM || 0, color: "#ca8a04" },
        { name: "Low", value: candidateAnalytics.priority_distribution.LOW || 0, color: "#16a34a" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan-400" /> Mission Analytics & Detection Metrics
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Survey screening throughput, candidate classification distribution, and human-in-the-loop review statistics.
        </p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-[11px] uppercase font-semibold text-slate-400">Total Candidates</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">
            {candidateAnalytics?.total || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Across all SSS surveys</div>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-[11px] uppercase font-semibold text-slate-400">
            Review Completion
          </div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            {reviewAnalytics?.completion_pct || 0}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {reviewAnalytics?.reviewed || 0} / {reviewAnalytics?.total_candidates || 0} verified
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-[11px] uppercase font-semibold text-slate-400">Accepted Debris Rate</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {reviewAnalytics?.reviewed > 0
              ? `${((reviewAnalytics.accepted / reviewAnalytics.reviewed) * 100).toFixed(0)}%`
              : "0%"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {reviewAnalytics?.accepted || 0} confirmed findings
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Detected Object Classifications</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Inspection Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <div className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
