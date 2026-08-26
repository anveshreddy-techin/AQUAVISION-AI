"use client";

import React, { useEffect, useState } from "react";
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

  const fetchQueueData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [candRes, statsRes] = await Promise.all([
        api.get<{ candidates: Candidate[]; total: number }>(`/candidates`),
        api.get<ReviewStats>(`/review/stats`),
      ]);
      setCandidates(candRes.candidates || []);
      setStats(statsRes);
      if (candRes.candidates?.length > 0 && !selectedCandidate) {
        setSelectedCandidate(candRes.candidates[0]);
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

  const handleAction = async (action: string, reviewedLabel?: string) => {
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

      // Select next pending candidate if available
      const nextPending = updatedCandidates.find((c) => c.status === "PENDING" && c.id !== selectedCandidate.id);
      if (nextPending) {
        setSelectedCandidate(nextPending);
      }
      setReviewNotes("");

      // Refresh review stats
      const newStats = await api.get<ReviewStats>(`/review/stats`);
      setStats(newStats);
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesPriority = priorityFilter === "ALL" || c.priority_category === priorityFilter;
    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "PENDING"
        ? c.status === "PENDING" || c.status === "UNDER_REVIEW"
        : c.status === statusFilter;
    return matchesPriority && matchesStatus;
  });

  if (loading) return <LoadingState message="Loading Human Review Queue..." />;
  if (error) return <ErrorState message={error} onRetry={fetchQueueData} />;

  return (
    <div className="space-y-6">
      {/* Review Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-cyan-400" /> Human Review Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Expert verification of AI candidate regions, false-positive rejection & ground-truth annotation.
          </p>
        </div>

        {/* Progress summary */}
        {stats && (
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="space-y-1 w-44">
              <div className="flex justify-between text-[11px] font-semibold text-slate-300 font-mono">
                <span>VERIFICATION PROGRESS</span>
                <span className="text-cyan-400">{stats.review_completion_pct}%</span>
              </div>
              <Progress value={stats.review_completion_pct} max={100} className="h-2" />
            </div>
            <div className="border-l border-slate-800 pl-4 text-xs space-y-0.5 font-mono">
              <div className="text-emerald-400 font-bold">{stats.accepted} Accepted</div>
              <div className="text-red-400 font-bold">{stats.rejected} Rejected</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Review Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Candidate List (7 Cols) */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          {/* Filter Toolbar */}
          <div className="flex items-center gap-3">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-36 h-9 text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">CRITICAL (Top)</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36 h-9 text-xs"
            >
              <option value="PENDING">Pending Only</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="UNCERTAIN">Uncertain</option>
              <option value="ALL">All Statuses</option>
            </Select>

            <span className="text-xs text-slate-500 font-mono ml-auto">
              {filteredCandidates.length} in queue
            </span>
          </div>

          {filteredCandidates.length === 0 ? (
            <EmptyState
              title="Review queue empty"
              description="No candidates match the selected filters or all candidates have been reviewed."
            />
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((c) => {
                    const isSelected = selectedCandidate?.id === c.id;
                    return (
                      <TableRow
                        key={c.id}
                        onClick={() => setSelectedCandidate(c)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-cyan-950/40 border-l-2 border-l-cyan-500" : ""
                        }`}
                      >
                        <TableCell>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.priority_category === "CRITICAL"
                                ? "bg-red-950 text-red-300 border border-red-800"
                                : c.priority_category === "HIGH"
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : c.priority_category === "MEDIUM"
                                ? "bg-yellow-950 text-yellow-300 border border-yellow-800"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            }`}
                          >
                            {c.priority_category} ({c.priority_score.toFixed(2)})
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-200">
                          #{c.id}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-200">
                          {c.object_class || "Anomaly Region"}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-400">
                          {c.confidence ? `${(c.confidence * 100).toFixed(0)}%` : "N/A"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-cyan-400 hover:text-cyan-300"
                          >
                            Inspect →
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Inspection & Action Inspector (5 Cols) */}
        <div className="col-span-12 lg:col-span-5">
          {selectedCandidate ? (
            <Card className="border-slate-800 bg-slate-900/80 sticky top-4 space-y-4 p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Candidate #{selectedCandidate.id} Inspection
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Type: {selectedCandidate.candidate_type} • Survey #{selectedCandidate.survey_id}
                  </p>
                </div>
                <StatusBadge status={selectedCandidate.status} />
              </div>

              {/* Acoustic Evidence Viewports (Side-by-Side Simulation) */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                  Acoustic Evidence Layers
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-center space-y-1">
                    <div className="h-28 rounded bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:12px_12px]" />
                      <span className="text-[10px] font-mono text-cyan-500 z-10">RAW SSS TILE</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Original Acoustic Scan</div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-center space-y-1">
                    <div className="h-28 rounded bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:12px_12px]" />
                      <div className="h-10 w-16 border-2 border-red-500 bg-red-500/10 rounded z-10 animate-pulse" />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">CLAHE + Detection BBox</div>
                  </div>
                </div>
              </div>

              {/* AI Metadata Details */}
              <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Predicted Class:</span>
                  <span className="text-slate-200 font-bold">{selectedCandidate.object_class}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Detector Confidence:</span>
                  <span className="text-slate-200">
                    {selectedCandidate.confidence
                      ? `${(selectedCandidate.confidence * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Anomaly Reconstruction Error:</span>
                  <span className="text-amber-400">
                    {selectedCandidate.anomaly_score
                      ? selectedCandidate.anomaly_score.toFixed(3)
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Inspection Priority Score:</span>
                  <span className="text-red-400 font-bold">
                    {selectedCandidate.priority_score.toFixed(3)} (
                    {selectedCandidate.priority_category})
                  </span>
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Verification Note / Justification
                </label>
                <Textarea
                  placeholder="e.g., Confirmed synthetic debris target; distinct acoustic shadow visible..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>

              {/* Verification Action Grid */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">
                  Verify & Persist Decision
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleAction("ACCEPT")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> Accept Debris
                  </Button>

                  <Button
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleAction("REJECT")}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs h-8 gap-1"
                  >
                    <X className="h-3.5 w-3.5" /> Reject Candidate
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submitting}
                    onClick={() => handleAction("NATURAL_FEATURE", "Natural Feature")}
                    className="text-xs h-8 gap-1 border-slate-700"
                  >
                    <Anchor className="h-3.5 w-3.5 text-slate-400" /> Natural Feature
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submitting}
                    onClick={() => handleAction("POTENTIAL_GEAR", "Fishing Gear / Net")}
                    className="text-xs h-8 gap-1 border-slate-700"
                  >
                    <Fish className="h-3.5 w-3.5 text-cyan-400" /> Fishing Gear
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500 text-xs">
              Select a candidate from the queue to review.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
