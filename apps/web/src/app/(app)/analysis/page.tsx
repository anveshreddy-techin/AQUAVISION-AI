"use client";

import React, { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Survey, SurveyFrame, Candidate } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/common/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { ModalityBadge } from "@/components/common/modality-badge";
import { MaturityBadge } from "@/components/common/maturity-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Microscope,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  X,
  Sparkles,
  Info,
  ShieldCheck,
} from "lucide-react";

export default function AnalysisWorkspacePage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [frames, setFrames] = useState<SurveyFrame[]>([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Viewer Controls
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [viewMode, setViewMode] = useState<"original" | "enhanced" | "detections" | "anomaly">("detections");

  // Load surveys initially
  useEffect(() => {
    const fetchSurveys = async () => {
      setLoading(true);
      try {
        const res = await api.get<{ surveys: Survey[]; total: number }>("/surveys");
        setSurveys(res.surveys || []);
        if (res.surveys?.length > 0) {
          setSelectedSurveyId(res.surveys[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load surveys");
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  // Load frames & candidates when survey changes
  useEffect(() => {
    if (!selectedSurveyId) return;
    const fetchSurveyData = async () => {
      try {
        const [frameData, candidateData] = await Promise.all([
          api.get<SurveyFrame[]>(`/surveys/${selectedSurveyId}/frames`),
          api.get<{ candidates: Candidate[]; total: number }>(`/surveys/${selectedSurveyId}/candidates`),
        ]);
        setFrames(frameData || []);
        setCandidates(candidateData.candidates || []);
        setCurrentFrameIdx(0);
      } catch (err: any) {
        console.error(err);
      }
    };
    fetchSurveyData();
  }, [selectedSurveyId]);

  const currentFrame = frames[currentFrameIdx];
  const frameCandidates = candidates.filter((c) => {
    // In synthetic demo or tiled setups, map to candidates
    return true; // Show survey-level candidates
  });

  const selectedCandidate = candidates[0] || null;

  const handleReviewAction = async (action: string) => {
    if (!selectedCandidate) return;
    try {
      await api.post(`/review/candidates/${selectedCandidate.id}/action`, {
        action,
        notes: "Verified via Analysis Workspace",
      });
      // Refresh candidates
      const res = await api.get<{ candidates: Candidate[]; total: number }>(
        `/surveys/${selectedSurveyId}/candidates`
      );
      setCandidates(res.candidates || []);
    } catch (err: any) {
      alert(err.message || "Action failed");
    }
  };

  if (loading) return <LoadingState message="Launching Analysis Workspace..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-3">
      {/* Top Workspace Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Microscope className="h-5 w-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white">SSS Sonar Analysis Console</h1>
          </div>
          <select
            value={selectedSurveyId || ""}
            onChange={(e) => setSelectedSurveyId(Number(e.target.value))}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.sonar_modality})
              </option>
            ))}
          </select>
          <ModalityBadge modality="SSS" />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setViewMode("original")}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === "original"
                  ? "bg-slate-800 text-cyan-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Raw SSS
            </button>
            <button
              onClick={() => setViewMode("enhanced")}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === "enhanced"
                  ? "bg-slate-800 text-cyan-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              CLAHE Enhanced
            </button>
            <button
              onClick={() => setViewMode("detections")}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === "detections"
                  ? "bg-slate-800 text-cyan-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Detections Overlay
            </button>
            <button
              onClick={() => setViewMode("anomaly")}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === "anomaly"
                  ? "bg-slate-800 text-cyan-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Anomaly Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* 3-Panel Main Workspace */}
      <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* LEFT PANEL: Survey & Frame Navigation (2.5 Cols) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col space-y-3 overflow-y-auto pr-1">
          <Card className="bg-slate-900/70 border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200">Frame Navigation</span>
              <span className="text-[11px] font-mono text-cyan-400">
                {frames.length > 0 ? `${currentFrameIdx + 1} / ${frames.length}` : "0/0"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentFrameIdx === 0}
                onClick={() => setCurrentFrameIdx((i) => Math.max(0, i - 1))}
                className="w-1/2 h-8 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentFrameIdx >= frames.length - 1}
                onClick={() => setCurrentFrameIdx((i) => Math.min(frames.length - 1, i + 1))}
                className="w-1/2 h-8 text-xs gap-1"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5 pt-2 text-xs text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Frame Index:</span>
                <span className="text-slate-200">#{currentFrame?.sequence_index ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Resolution:</span>
                <span className="text-slate-200">
                  {currentFrame?.width || 2048} x {currentFrame?.height || 1024}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Modality:</span>
                <span className="text-cyan-400">SSS Waterfall</span>
              </div>
            </div>
          </Card>

          {/* Display & Contrast Adjustments */}
          <Card className="bg-slate-900/70 border-slate-800 p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sliders className="h-3.5 w-3.5 text-cyan-400" /> Acoustic Image Controls
            </div>

            <div className="space-y-2 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Zoom ({zoom.toFixed(1)}x)</span>
                  <button onClick={() => setZoom(1)} className="text-cyan-500 hover:underline">
                    Reset
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}>
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-cyan-500"
                  />
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Contrast ({contrast}%)</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Brightness ({brightness}%)</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* CENTER PANEL: Sonar Viewport (6.5 Cols) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col rounded-xl border border-slate-800 bg-slate-950 p-2 relative overflow-hidden">
          <div className="absolute top-4 left-4 z-10 rounded bg-slate-950/80 border border-slate-800 px-2 py-1 text-[10px] font-mono text-cyan-400 backdrop-blur-sm">
            MODE: {viewMode.toUpperCase()} • ZOOM: {zoom.toFixed(1)}X
          </div>

          <div className="flex-1 flex items-center justify-center overflow-auto rounded-lg bg-slate-900/40 relative">
            <div
              className="relative transition-transform duration-100 ease-out"
              style={{
                transform: `scale(${zoom})`,
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              }}
            >
              {/* Sonar Canvas Visual Simulation */}
              <div className="w-[600px] h-[360px] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded border border-slate-800 relative overflow-hidden flex items-center justify-center">
                {/* Sonar seabed noise & acoustic waterfall texture */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-cyan-500/20 border-r border-dashed border-cyan-500/40" />

                {/* Simulated Target Region with Bounding Box Overlay */}
                {(viewMode === "detections" || viewMode === "original" || viewMode === "enhanced") && (
                  <div className="absolute left-[38%] top-[35%] w-24 h-16 border-2 border-red-500 bg-red-500/10 rounded flex flex-col justify-between p-1 animate-pulse">
                    <span className="text-[9px] font-bold text-red-300 font-mono bg-slate-950/80 px-1 rounded w-max">
                      CRITICAL: 0.85
                    </span>
                    <span className="text-[8px] text-slate-200 font-mono">Potential Debris</span>
                  </div>
                )}

                {/* Anomaly Heatmap simulation */}
                {viewMode === "anomaly" && (
                  <div className="absolute left-[35%] top-[30%] w-32 h-24 rounded-full bg-radial from-red-600/60 via-amber-600/30 to-transparent blur-md pointer-events-none" />
                )}

                {/* Center text if no real image loaded */}
                <div className="text-center space-y-1 z-10 pointer-events-none">
                  <p className="text-xs font-mono text-cyan-400">SSS ACOUSTIC FRAME #{currentFrameIdx + 1}</p>
                  <p className="text-[10px] text-slate-500">Synthetic Side-Scan Sonar Waterfall Stream</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: AI Intelligence & Verification (3 Cols) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col space-y-3 overflow-y-auto pl-1">
          <Card className="bg-slate-900/70 border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> AI Candidate Intelligence
              </span>
              <MaturityBadge maturity="DEMO" />
            </div>

            {selectedCandidate ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-100">
                    {selectedCandidate.object_class || "Potential Debris Candidate"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                      PRIORITY: {selectedCandidate.priority_category} ({selectedCandidate.priority_score.toFixed(2)})
                    </span>
                    <StatusBadge status={selectedCandidate.status} />
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-2.5 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Detector Conf:</span>
                    <span className="text-slate-200">
                      {selectedCandidate.confidence ? `${(selectedCandidate.confidence * 100).toFixed(0)}%` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Anomaly Error:</span>
                    <span className="text-amber-400">
                      {selectedCandidate.anomaly_score ? selectedCandidate.anomaly_score.toFixed(2) : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Model:</span>
                    <span className="text-cyan-400">SSS Demo Detector</span>
                  </div>
                </div>

                {/* Priority Formula Transparency */}
                <div className="rounded-lg bg-slate-950/40 border border-slate-800 p-2.5 space-y-1 text-[11px] text-slate-400">
                  <div className="font-semibold text-slate-300 flex items-center gap-1">
                    <Info className="h-3 w-3 text-cyan-400" /> Priority Weighting:
                  </div>
                  <p className="text-[10px] font-mono leading-relaxed text-slate-400">
                    0.35×Anomaly + 0.25×Conf + 0.20×Type + 0.20×Uncertainty
                  </p>
                </div>

                {/* Review Action Buttons */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    Operator Decision
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReviewAction("ACCEPT")}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 gap-1"
                    >
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReviewAction("REJECT")}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs h-8 gap-1"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">
                No active candidate in current frame.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
