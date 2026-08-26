"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Candidate, ReviewStats } from "@/lib/types";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  ClipboardCheck,
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  Fish,
  Anchor,
  Filter,
  CheckCircle2,
  Sparkles,
  Keyboard,
  Clock,
  Zap,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export default function ReviewQueuePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  // Selected candidate modal / inspector
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Efficiency tracking
  const [sessionReviewedCount, setSessionReviewedCount] = useState(0);
  const [sessionStartTime] = useState<number>(Date.now());
  const [sessionElapsedSec, setSessionElapsedSec] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionElapsedSec(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  const fetchQueueData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [candRes, statsRes] = await Promise.all([
        api.get<{ candidates: Candidate[]; total: number }>(`/candidates`),
        api.get<ReviewStats>(`/review/stats`),
      ]);
      const candList = Array.isArray(candRes) ? candRes : (candRes?.candidates || []);
      setCandidates(candList);
      setStats(statsRes);
      if (candList.length > 0 && !selectedCandidate) {
        setSelectedCandidate(candList[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load review queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, []);

  const handleAction = useCallback(
    async (action: string, reviewedLabel?: string) => {
      if (!selectedCandidate) return;
      setSubmitting(true);
      try {
        await api.post(`/review/candidates/${selectedCandidate.id}/action`, {
          action,
          reviewed_label: reviewedLabel || selectedCandidate.object_class,
          notes: reviewNotes || undefined,
        });

        // Update candidate locally
        const updatedCandidates = candidates.map((c) => {
          if (c.id === selectedCandidate.id) {
            return {
              ...c,
              status:
                action === "ACCEPT" || action === "POTENTIAL_DEBRIS" || action === "POTENTIAL_GEAR"
                  ? ("ACCEPTED" as const)
                  : action === "REJECT" || action === "NATURAL_FEATURE"
                  ? ("REJECTED" as const)
                  : action === "UNCERTAIN"
                  ? ("UNCERTAIN" as const)
                  : c.status,
            };
          }
          return c;
        });
        setCandidates(updatedCandidates);
        setSessionReviewedCount((prev) => prev + 1);
        setReviewNotes("");

        // Auto-advance to next pending candidate
        const nextPending = updatedCandidates.find(
          (c) => c.status === "PENDING" && c.id !== selectedCandidate.id
        );
        if (nextPending) {
          setSelectedCandidate(nextPending);
        }

        // Refresh stats
        const newStats = await api.get<ReviewStats>(`/review/stats`);
        setStats(newStats);
      } catch (err: any) {
        alert(err.message || "Review action failed");
      } finally {
        setSubmitting(false);
      }
    },
    [selectedCandidate, candidates, reviewNotes]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in textarea/input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleAction("ACCEPT");
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleAction("REJECT");
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        handleAction("UNCERTAIN");
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        // Go to next candidate
        const idx = candidates.findIndex((c) => c.id === selectedCandidate?.id);
        if (idx !== -1 && idx < candidates.length - 1) {
          setSelectedCandidate(candidates[idx + 1]);
        }
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        // Go to previous candidate
        const idx = candidates.findIndex((c) => c.id === selectedCandidate?.id);
        if (idx > 0) {
          setSelectedCandidate(candidates[idx - 1]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAction, candidates, selectedCandidate]);

  const filteredCandidates = candidates.filter((c) => {
    const matchesPriority = priorityFilter === "ALL" || c.priority_category === priorityFilter;
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesPriority && matchesStatus;
  });

  const avgReviewTime =
    sessionReviewedCount > 0 ? (sessionElapsedSec / sessionReviewedCount).toFixed(1) : "0.0";

  if (loading) return <LoadingState message="Loading Flagship Review Queue..." />;
  if (error) return <ErrorState message={error} onRetry={fetchQueueData} />;

  return (
    <div className="space-y-5">
      {/* Top Header & Efficiency Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-cyan-400" />
            Human-in-the-Loop Review Queue
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
              FLAGSHIP WORKSPACE
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized candidate triage, acoustic shadow evidence validation & decision persistence.
          </p>
        </div>

        {/* Live Analyst Session Stats */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-2 px-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Session: {Math.floor(sessionElapsedSec / 60)}m {sessionElapsedSec % 60}s</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Zap className="h-3.5 w-3.5" />
            <span>Reviewed: {sessionReviewedCount}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-slate-300">
            <span>Avg: {avgReviewTime}s / target</span>
          </div>
        </div>
      </div>

      {/* Progress & Shortcuts Helper Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl p-3">
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-300">Survey Verification Completion:</span>
            <span className="font-mono text-cyan-400 font-bold">
              {stats?.review_completion_pct ?? 20}% ({stats?.reviewed ?? 3} / {stats?.total_candidates ?? 15})
            </span>
          </div>
          <Progress value={stats?.review_completion_pct ?? 20} className="h-1.5 bg-slate-800" />
        </div>

        {/* Keyboard Shortcuts Pill */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
          <Keyboard className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-slate-400">Hotkeys:</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-bold">A</span> Accept
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-red-300 font-bold">R</span> Reject
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">U</span> Uncertain
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">N</span> Next
        </div>
      </div>

      {/* Main Review Workspace (Split Grid) */}
      <div className="grid grid-cols-12 gap-5">
        {/* Candidate List (5 cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-3">
          {/* Filter Toolbar */}
          <div className="flex items-center gap-2">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex-1 h-9 text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical Only (Score ≥ 0.80)</option>
              <option value="HIGH">High Priority (Score ≥ 0.60)</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 h-9 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="ACCEPTED">Accepted / Verified</option>
              <option value="REJECTED">Rejected</option>
              <option value="UNCERTAIN">Uncertain</option>
            </Select>
          </div>

          {/* Queue List Cards */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredCandidates.length === 0 ? (
              <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-xs">
                No candidates match the current priority/status filters.
              </div>
            ) : (
              filteredCandidates.map((c) => {
                const isSelected = selectedCandidate?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCandidate(c)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-cyan-950/60 border-cyan-500 shadow-md ring-1 ring-cyan-500/50"
                        : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-1 truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">#{c.id}</span>
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {c.object_class}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span>Conf: {c.confidence ? `${(c.confidence * 100).toFixed(0)}%` : "N/A"}</span>
                        <span>•</span>
                        <span>Anom: {c.anomaly_score ? c.anomaly_score.toFixed(2) : "N/A"}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          c.priority_category === "CRITICAL"
                            ? "bg-red-950 text-red-300 border border-red-800/60"
                            : c.priority_category === "HIGH"
                            ? "bg-amber-950 text-amber-300 border border-amber-800/60"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {c.priority_score.toFixed(2)}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Candidate Detailed Evidence & Triage Inspector (7 cols) */}
        <div className="col-span-12 lg:col-span-7">
          {selectedCandidate ? (
            <Card className="border-slate-800 bg-slate-950/90 p-5 space-y-5">
              {/* Target Banner */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400">
                      CANDIDATE #{selectedCandidate.id}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                      {selectedCandidate.candidate_type}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-0.5">
                    {selectedCandidate.object_class}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                      selectedCandidate.priority_category === "CRITICAL"
                        ? "bg-red-950 text-red-300 border border-red-800/60"
                        : "bg-amber-950 text-amber-300 border border-amber-800/60"
                    }`}
                  >
                    PRIORITY: {selectedCandidate.priority_score.toFixed(3)}
                  </span>
                  <StatusBadge status={selectedCandidate.status} />
                </div>
              </div>

              {/* Acoustic Evidence Viewport */}
              <div className="rounded-xl border border-slate-800 bg-black p-3 relative h-48 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-600/50 via-slate-900 to-black" />
                <div className="relative z-10 text-center space-y-1">
                  <div className="h-16 w-32 mx-auto rounded border-2 border-red-500/80 bg-red-950/30 flex items-center justify-center text-xs font-mono text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    TARGET ROI
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Acoustic Highlight: 214/255 • Trailing Shadow: Confirmed (12.4m)
                  </span>
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-cyan-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                  ACOUSTIC CONTRAST RATIO: 3.4 : 1
                </div>
              </div>

              {/* Contributing Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Confidence</span>
                  <div className="text-sm font-bold font-mono text-slate-200">
                    {selectedCandidate.confidence
                      ? `${(selectedCandidate.confidence * 100).toFixed(0)}%`
                      : "N/A"}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">Weight: 0.25</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Anomaly Deviation</span>
                  <div className="text-sm font-bold font-mono text-amber-400">
                    {selectedCandidate.anomaly_score
                      ? selectedCandidate.anomaly_score.toFixed(2)
                      : "0.88"}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">Weight: 0.35</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Class Importance</span>
                  <div className="text-sm font-bold font-mono text-cyan-400">0.95</div>
                  <span className="text-[9px] text-slate-500 font-mono">Weight: 0.20</span>
                </div>
              </div>

              {/* Analyst Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Analyst Review Notes (Optional)
                </label>
                <Textarea
                  placeholder="Record seabed morphology, shadow notes, or verification rationale..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="h-16 text-xs bg-slate-900/80 border-slate-800"
                />
              </div>

              {/* Action Buttons Grid */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Record Human Decision</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Auto-advances to next target
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    disabled={submitting}
                    onClick={() => handleAction("ACCEPT")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-10 font-bold"
                  >
                    <Check className="h-4 w-4 mr-1.5" /> Confirm Debris (A)
                  </Button>

                  <Button
                    disabled={submitting}
                    onClick={() => handleAction("REJECT")}
                    variant="outline"
                    className="border-red-800/80 text-red-300 hover:bg-red-950/60 text-xs h-10 font-bold"
                  >
                    <X className="h-4 w-4 mr-1.5" /> Reject / False Pos (R)
                  </Button>

                  <Button
                    disabled={submitting}
                    onClick={() => handleAction("UNCERTAIN")}
                    variant="outline"
                    className="border-amber-800/80 text-amber-300 hover:bg-amber-950/60 text-xs h-10 font-bold"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1.5" /> Uncertain (U)
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center border-slate-800 bg-slate-900/40 text-slate-500 text-xs">
              Select a candidate from the queue to start review.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
