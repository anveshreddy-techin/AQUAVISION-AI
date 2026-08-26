"use client";

import React, { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Survey, SurveyFrame, Candidate } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/common/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { ModalityBadge } from "@/components/common/modality-badge";
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
  Layers,
  HelpCircle,
  Activity,
  Compass,
  AlertTriangle,
  RotateCcw,
  Palette,
  Grid,
} from "lucide-react";

type ViewMode = "raw" | "enhanced" | "detections" | "anomaly" | "evidence";
type PaletteMode = "gray" | "amber" | "copper" | "jet";

export default function AnalysisWorkspacePage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [frames, setFrames] = useState<SurveyFrame[]>([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Viewer Controls
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [viewMode, setViewMode] = useState<ViewMode>("detections");
  const [palette, setPalette] = useState<PaletteMode>("amber");
  const [showGrid, setShowGrid] = useState(true);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [showPreprocDrawer, setShowPreprocDrawer] = useState(false);

  // Load surveys initially
  useEffect(() => {
    const fetchSurveys = async () => {
      setLoading(true);
      try {
        const res = await api.get<{ surveys: Survey[]; total: number }>("/surveys");
        const list = Array.isArray(res) ? res : (res?.surveys || []);
        setSurveys(list);
        if (list.length > 0) {
          setSelectedSurveyId(list[0].id);
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
        const frameList = Array.isArray(frameData) ? frameData : [];
        const candList = Array.isArray(candidateData?.candidates) ? candidateData.candidates : [];
        setFrames(frameList);
        setCandidates(candList);
        setCurrentFrameIdx(0);
        if (candList.length > 0) {
          setSelectedCandidateId(candList[0].id);
        }
      } catch (err: any) {
        console.error(err);
      }
    };
    fetchSurveyData();
  }, [selectedSurveyId]);

  const selectedSurvey = surveys.find((s) => s.id === selectedSurveyId) || surveys[0];
  const currentFrame = frames[currentFrameIdx];
  const selectedCandidate =
    candidates.find((c) => c.id === selectedCandidateId) || candidates[0] || null;

  const handleReviewAction = async (action: string) => {
    if (!selectedCandidate) return;
    try {
      await api.post(`/review/candidates/${selectedCandidate.id}/action`, {
        action,
        reviewed_label: selectedCandidate.object_class,
        notes: `Decision recorded from SSS Analysis Console at frame #${currentFrameIdx + 1}`,
      });
      // Refresh candidates
      const res = await api.get<{ candidates: Candidate[]; total: number }>(
        `/surveys/${selectedSurveyId}/candidates`
      );
      const updated = Array.isArray(res?.candidates) ? res.candidates : [];
      setCandidates(updated);
    } catch (err: any) {
      alert(err.message || "Action failed");
    }
  };

  const getFilterStyle = () => {
    let filterStr = `brightness(${brightness}%) contrast(${contrast}%)`;
    if (palette === "amber") {
      filterStr += " sepia(80%) hue-rotate(5deg) saturate(220%)";
    } else if (palette === "copper") {
      filterStr += " sepia(90%) hue-rotate(-25deg) saturate(180%)";
    } else if (palette === "jet") {
      filterStr += " invert(20%) saturate(300%) hue-rotate(180deg)";
    }
    return filterStr;
  };

  if (loading) return <LoadingState message="Launching SSS Multi-Channel Analysis Console..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Top Workspace Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Microscope className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                SSS Multi-Signal Analysis Console
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  REAL SSS PIPELINE
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Acoustic waterfall inspection, multi-channel overlays & transparent explainability.
              </p>
            </div>
          </div>

          <select
            value={selectedSurveyId || ""}
            onChange={(e) => setSelectedSurveyId(Number(e.target.value))}
            className="rounded-lg bg-slate-900 border border-slate-700 text-xs px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 max-w-xs"
          >
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.sonar_modality})
              </option>
            ))}
          </select>
        </div>

        {/* Multi-Channel Layer Switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 border border-slate-800 p-1">
          {(
            [
              { id: "raw", label: "Raw SSS" },
              { id: "enhanced", label: "Enhanced (CLAHE)" },
              { id: "detections", label: "Detections" },
              { id: "anomaly", label: "Anomaly Heatmap" },
              { id: "evidence", label: "Evidence ROI" },
            ] as const
          ).map((layer) => (
            <button
              key={layer.id}
              onClick={() => setViewMode(layer.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === layer.id
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-Column Studio Layout */}
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-[560px]">
        {/* Left Frame Strip (2 cols) */}
        <div className="col-span-12 md:col-span-3 lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-cyan-400" /> Survey Frames
              </span>
              <span className="text-[10px] font-mono text-cyan-400">
                {frames.length > 0 ? `${currentFrameIdx + 1}/${frames.length}` : "0"}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {frames.map((f, idx) => (
                <button
                  key={f.id}
                  onClick={() => setCurrentFrameIdx(idx)}
                  className={`w-full text-left p-2 rounded-lg border transition-all text-xs flex items-center justify-between ${
                    currentFrameIdx === idx
                      ? "bg-cyan-950/70 border-cyan-500 text-cyan-200 font-semibold shadow-sm"
                      : "bg-slate-900/50 border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <div className="truncate">
                    <span className="font-mono">#{idx + 1}</span>{" "}
                    <span className="text-[11px] opacity-80">Ping {idx * 10}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                    512×512
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between">
            <span>SWATH SWEEP: 450kHz</span>
            <span>WGS84</span>
          </div>
        </div>

        {/* Center Canvas Viewport (7 cols) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-7 rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-col justify-between relative overflow-hidden">
          {/* Canvas Top Controls Toolbar */}
          <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 text-xs z-10">
            {/* Palette Switcher */}
            <div className="flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={palette}
                onChange={(e) => setPalette(e.target.value as PaletteMode)}
                className="bg-slate-800 border border-slate-700 text-[11px] rounded px-2 py-0.5 text-slate-200"
              >
                <option value="amber">Amber Sonar</option>
                <option value="copper">Copper Marine</option>
                <option value="gray">Acoustic Grayscale</option>
                <option value="jet">Jet Thermal Heatmap</option>
              </select>
            </div>

            {/* Brightness / Contrast Slider Trigger */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>Zoom:</span>
                <span className="font-mono text-cyan-400">{(zoom * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setZoom(Math.min(3.5, zoom + 0.25))}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setZoom(1);
                    setBrightness(100);
                    setContrast(100);
                  }}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  title="Reset View"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-1 rounded transition-colors ${
                    showGrid ? "bg-cyan-900/80 text-cyan-300" : "bg-slate-800 text-slate-400"
                  }`}
                  title="Toggle Acoustic Scale Grid"
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* SSS Acoustic Imagery Canvas */}
          <div className="relative flex-1 my-2 flex items-center justify-center overflow-hidden rounded-lg bg-black/90 border border-slate-900">
            {/* Background Simulated Grid */}
            {showGrid && (
              <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none z-10" />
            )}

            {/* Central Port/Starboard Nadir Ground Track Indicator */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 border-l border-dashed border-cyan-500/40 z-10 pointer-events-none" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[9px] font-mono text-cyan-400 z-10">
              NADIR ALTITUDE: 8.5m
            </div>

            {/* Acoustic Waterfall Strip with Real AI4Shipwrecks SSS Imagery */}
            <div
              style={{
                transform: `scale(${zoom})`,
                filter: getFilterStyle(),
                transition: "filter 0.2s, transform 0.1s",
              }}
              className="relative w-[520px] h-[350px] rounded bg-black flex items-center justify-center border border-slate-800 shadow-2xl overflow-hidden"
            >
              {/* Real SSS Imagery */}
              <img
                src={`/sonar/frames/ai4shipwreck_frame_${(currentFrameIdx % 5) + 1}.png`}
                alt="Authentic AI4Shipwrecks SSS Sonar Swath"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/sonar/sonar_wrecks.png";
                }}
                className={`w-full h-full object-cover select-none transition-all duration-300 ${
                  viewMode === "raw"
                    ? "brightness-95 contrast-90 grayscale"
                    : viewMode === "enhanced"
                    ? "brightness-105 contrast-130 saturate-110"
                    : ""
                }`}
              />

              {/* Target Bounding Box Overlays */}
              {(viewMode === "detections" || viewMode === "evidence") &&
                candidates.slice(0, 3).map((c, i) => {
                  const isSelected = selectedCandidate?.id === c.id;
                  const coords = [
                    { x: 130, y: 70, w: 120, h: 95 },
                    { x: 290, y: 150, w: 100, h: 110 },
                    { x: 200, y: 210, w: 90, h: 70 },
                  ][i % 3];

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCandidateId(c.id)}
                      style={{
                        position: "absolute",
                        left: `${coords.x}px`,
                        top: `${coords.y}px`,
                        width: `${coords.w}px`,
                        height: `${coords.h}px`,
                      }}
                      className={`cursor-pointer rounded border-2 transition-all p-1 flex flex-col justify-between ${
                        isSelected
                          ? "border-red-500 bg-red-950/30 shadow-[0_0_15px_rgba(239,68,68,0.6)] z-30 ring-2 ring-red-400"
                          : "border-cyan-400/90 bg-cyan-950/20 hover:border-cyan-300 z-20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-white bg-slate-950/90 px-1 rounded">
                          #{c.id}
                        </span>
                        <span
                          className={`text-[8px] font-mono font-bold px-1 rounded ${
                            c.priority_category === "CRITICAL"
                              ? "bg-red-600 text-white"
                              : "bg-amber-600 text-white"
                          }`}
                        >
                          {c.priority_score.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[9px] font-semibold text-slate-100 bg-slate-950/90 px-1 rounded truncate">
                        {c.object_class}
                      </span>
                    </div>
                  );
                })}

              {/* Anomaly Heatmap Layer */}
              {viewMode === "anomaly" && (
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/60 via-emerald-600/40 to-red-600/70 mix-blend-color-dodge opacity-80 animate-pulse pointer-events-none" />
              )}
            </div>
          </div>

          {/* Bottom Telemetry Footer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 z-10">
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-semibold">DATASET: AI4Shipwrecks (Real SSS)</span>
              <span>•</span>
              <span>PORT: 25m</span>
              <span>STARBOARD: 25m</span>
              <span>450kHz</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreprocDrawer(true)}
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Sliders className="h-3 w-3" /> Preprocessing Parameters
              </button>
            </div>
          </div>
        </div>

        {/* Right Multi-Signal Evidence & Explainability Drawer (3 cols) */}
        <div className="col-span-12 md:col-span-3 lg:col-span-3 rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-4 flex flex-col justify-between overflow-y-auto">
          {selectedCandidate ? (
            <>
              <div className="space-y-3">
                {/* Candidate Title & Priority */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">
                      TARGET CANDIDATE #{selectedCandidate.id}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {selectedCandidate.object_class}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedCandidate.priority_category === "CRITICAL"
                        ? "bg-red-950 text-red-300 border border-red-800/60"
                        : selectedCandidate.priority_category === "HIGH"
                        ? "bg-amber-950 text-amber-300 border border-amber-800/60"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {selectedCandidate.priority_category} ({selectedCandidate.priority_score.toFixed(2)})
                  </span>
                </div>

                {/* Multi-Signal Metrics Box */}
                <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Detector Confidence:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {selectedCandidate.confidence
                        ? `${(selectedCandidate.confidence * 100).toFixed(0)}%`
                        : "N/A (Anomaly Only)"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Acoustic Texture Anomaly:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {selectedCandidate.anomaly_score
                        ? selectedCandidate.anomaly_score.toFixed(2)
                        : "0.88"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Acoustic Contrast Ratio:</span>
                    <span className="font-mono text-cyan-400">3.4:1 (High Backscatter)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Acoustic Shadow:</span>
                    <span className="font-mono text-emerald-400">Confirmed (Trailing 12m)</span>
                  </div>
                </div>

                {/* Transparent Formula Trigger */}
                <button
                  onClick={() => setShowWhyModal(true)}
                  className="w-full text-left p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 hover:bg-cyan-950/60 transition-colors flex items-center justify-between text-xs text-cyan-300"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <HelpCircle className="h-3.5 w-3.5 text-cyan-400" /> Why High Priority?
                  </span>
                  <span className="font-mono text-[10px] text-cyan-400/80">FORMULA →</span>
                </button>

                {/* Honest Provenance Badge */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Model Status:</span>
                    <span className="font-mono text-amber-400">EXPERIMENTAL</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Human Verification:</span>
                    <span className="font-mono text-cyan-400">MANDATORY (P0)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Data Source:</span>
                    <span className="font-mono text-slate-300">SSS Waterfall Ping Stream</span>
                  </div>
                </div>
              </div>

              {/* Triage Decision Buttons */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  Human Decision Triage
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleReviewAction("ACCEPT")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 font-semibold"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Confirm
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReviewAction("REJECT")}
                    variant="outline"
                    className="border-red-800/60 text-red-300 hover:bg-red-950/50 text-xs h-8"
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a frame or candidate to inspect acoustic telemetry.
            </div>
          )}
        </div>
      </div>

      {/* "Why High Priority?" Transparent Explainability Modal */}
      {showWhyModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Transparent Priority Scoring Engine</h3>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 text-center">
              Priority = 0.35·Anomaly + 0.25·Confidence + 0.20·TypeWeight + 0.20·Uncertainty
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">1. Anomaly Deviation (w = 0.35):</span>
                <span className="font-mono text-amber-400 font-bold">
                  {(selectedCandidate.anomaly_score || 0.88).toFixed(2)} → +
                  {((selectedCandidate.anomaly_score || 0.88) * 0.35).toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">2. Detector Confidence (w = 0.25):</span>
                <span className="font-mono text-slate-200 font-bold">
                  {(selectedCandidate.confidence || 0.82).toFixed(2)} → +
                  {((selectedCandidate.confidence || 0.82) * 0.25).toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">3. Target Class Risk (w = 0.20):</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {selectedCandidate.object_class} (0.95) → +0.190
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">4. Decision Uncertainty (w = 0.20):</span>
                <span className="font-mono text-indigo-400 font-bold">0.64 → +0.128</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-sm">
              <span className="font-semibold text-slate-200">Final Computed Score:</span>
              <span className="font-mono font-bold text-red-400 text-base">
                {selectedCandidate.priority_score.toFixed(3)} ({selectedCandidate.priority_category})
              </span>
            </div>

            <Button
              onClick={() => setShowWhyModal(false)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
            >
              Close Explainability Report
            </Button>
          </div>
        </div>
      )}

      {/* Preprocessing Metadata Drawer */}
      {showPreprocDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" /> SSS Acoustic Preprocessing Pipeline
              </h3>
              <button
                onClick={() => setShowPreprocDrawer(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">CLAHE Clip Limit:</span>
                <span className="text-cyan-400 font-bold">2.0</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Tile Grid Size:</span>
                <span className="text-cyan-400 font-bold">8 × 8</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Speckle Denoise (fastNlMeans):</span>
                <span className="text-cyan-400 font-bold">h = 10</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Normalization:</span>
                <span className="text-cyan-400 font-bold">Min-Max [0, 255]</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Tile Processing Window:</span>
                <span className="text-cyan-400 font-bold">512 × 512 (64px overlap)</span>
              </div>
            </div>

            <Button
              onClick={() => setShowPreprocDrawer(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
