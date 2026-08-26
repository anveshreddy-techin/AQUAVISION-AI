"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Candidate } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/common/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  Compass,
  ArrowRight,
  ShieldCheck,
  Radio,
  Layers,
  Crosshair,
} from "lucide-react";

export default function MapPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const res = await api.get<{ candidates: Candidate[]; total: number }>("/candidates");
        const list = Array.isArray(res) ? res : (res?.candidates || []);
        setCandidates(list);
        if (list.length > 0) {
          setSelectedCandidate(list[0]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load candidate coordinates");
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  if (loading) return <LoadingState message="Plotting Survey Swaths & Geographic Telemetry..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Compass className="h-5 w-5 text-cyan-400" /> Geospatial Survey Map & Swath Tracklines
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Spatial distribution of acoustic debris candidates, sonar swath swaths, and coordinate quality verification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[11px] font-mono text-cyan-400 flex items-center gap-1.5">
            <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
            PROJECTION: WGS84 • BATHYMETRIC OVERLAY
          </span>
        </div>
      </div>

      {/* Map + Detail Panel */}
      <div className="grid grid-cols-12 gap-6">
        {/* Interactive Spatial Grid Canvas (8 cols) */}
        <div className="col-span-12 lg:col-span-8 rounded-xl border border-slate-800 bg-slate-950 p-4 relative min-h-[500px] flex flex-col justify-between overflow-hidden">
          {/* Sonar Swath Grid Background */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#0891b2_1px,transparent_1px),linear-gradient(to_bottom,#0891b2_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          {/* Compass Rose & Telemetry Bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-1.5 text-xs font-mono text-slate-300">
              <Navigation className="h-3.5 w-3.5 text-cyan-400 transform -rotate-45" />
              LAT: 13.0827° N • LON: 80.2707° E (Chennai Harbor Approach)
            </div>
            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg">
              <span className="flex items-center gap-1 text-[10px] font-mono text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> Critical Target
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> High Priority
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Verified
              </span>
            </div>
          </div>

          {/* Plotted Target Markers Simulation */}
          <div className="relative z-10 my-auto h-72 w-full flex items-center justify-center">
            {/* Survey Trackline representation */}
            <div className="absolute w-[85%] h-0.5 bg-cyan-500/40 border-t border-dashed border-cyan-400/80" />
            <div className="absolute left-[8%] top-[35%] text-[9px] font-mono text-cyan-500/80 bg-slate-950/80 px-1 rounded">
              SWATH 01 (PORT: 25m)
            </div>
            <div className="absolute right-[8%] top-[65%] text-[9px] font-mono text-cyan-500/80 bg-slate-950/80 px-1 rounded">
              SWATH 01 (STARBOARD: 25m)
            </div>

            {/* Candidate Markers */}
            {candidates.slice(0, 8).map((c, idx) => {
              const offsets = [
                { x: "25%", y: "45%" },
                { x: "42%", y: "30%" },
                { x: "55%", y: "65%" },
                { x: "70%", y: "40%" },
                { x: "35%", y: "70%" },
                { x: "62%", y: "25%" },
                { x: "18%", y: "55%" },
                { x: "82%", y: "50%" },
              ];
              const pos = offsets[idx % offsets.length];
              const isSelected = selectedCandidate?.id === c.id;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCandidate(c)}
                  style={{ left: pos.x, top: pos.y }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 p-1 rounded-full transition-all group ${
                    isSelected
                      ? "ring-2 ring-cyan-400 scale-125 z-30"
                      : "hover:scale-110 z-20"
                  }`}
                  title={`${c.object_class} (Score: ${c.priority_score.toFixed(2)})`}
                >
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-lg ${
                      c.priority_category === "CRITICAL"
                        ? "bg-red-600 animate-bounce"
                        : c.priority_category === "HIGH"
                        ? "bg-amber-600"
                        : "bg-cyan-600"
                    }`}
                  >
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Map Footer status */}
          <div className="relative z-10 text-[10px] text-slate-500 font-mono flex justify-between border-t border-slate-800/80 pt-2">
            <span>ACOUSTIC TRACKLINE SURVEY • 450kHz SWATH</span>
            <span>COORDINATE QUALITY: MEDIUM (GPS + SSS LAYBACK)</span>
          </div>
        </div>

        {/* Selected Candidate Metadata Panel (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {selectedCandidate ? (
            <Card className="border-slate-800 bg-slate-900/90 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Target Marker #{selectedCandidate.id}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Class: {selectedCandidate.object_class}
                  </p>
                </div>
                <StatusBadge status={selectedCandidate.status} />
              </div>

              {/* Coordinate Quality Rating Badge */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Coordinate Quality:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold">
                  MEDIUM (GPS + Layback)
                </span>
              </div>

              <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Depth:</span>
                  <span className="text-slate-200">18.4 meters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Priority Score:</span>
                  <span className="text-red-400 font-bold">
                    {selectedCandidate.priority_score.toFixed(2)} (
                    {selectedCandidate.priority_category})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Detector Confidence:</span>
                  <span className="text-slate-200">
                    {selectedCandidate.confidence
                      ? `${(selectedCandidate.confidence * 100).toFixed(0)}%`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Anomaly Deviation:</span>
                  <span className="text-amber-400">
                    {selectedCandidate.anomaly_score
                      ? selectedCandidate.anomaly_score.toFixed(2)
                      : "0.88"}
                  </span>
                </div>
              </div>

              {/* Synchronized Action Buttons */}
              <div className="space-y-2">
                <Link href={`/review?candidate_id=${selectedCandidate.id}`}>
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-500 gap-1.5 text-xs font-semibold">
                    Inspect in Review Queue <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href={`/analysis?candidate_id=${selectedCandidate.id}`}>
                  <Button variant="outline" className="w-full text-xs font-medium border-slate-700">
                    Open in Sonar Analysis Console
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500 text-xs">
              Click a target marker on the map to inspect spatial telemetry.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
