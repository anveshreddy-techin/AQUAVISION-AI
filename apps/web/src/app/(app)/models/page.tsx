"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ModelVersion } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/common/loading-state";
import { ModalityBadge } from "@/components/common/modality-badge";
import { MaturityBadge } from "@/components/common/maturity-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Brain,
  ShieldAlert,
  Cpu,
  CheckCircle,
  AlertTriangle,
  FileSearch,
  Sliders,
  Bug,
} from "lucide-react";

export default function AIModelsPage() {
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelVersion | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const list = await api.get<ModelVersion[]>("/models");
        const modelList = Array.isArray(list) ? list : [];
        setModels(modelList);
        if (modelList.length > 0) {
          setSelectedModel(modelList[0]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load models");
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  if (loading) return <LoadingState message="Loading AI Model Center & Validation Registry..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-cyan-400" /> AI Model Center & Scientific Maturity Registry
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Acoustic object detectors, anomaly autoencoders, and scientific maturity certifications under the SIH26057 Honesty Protocol.
        </p>
      </div>

      {/* Honesty Contract Banner */}
      <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/20 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
          <ShieldAlert className="h-4 w-4 text-cyan-400" />
          <span>Scientific Integrity Notice (Honesty Contract Section 96.26)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Models labeled <span className="text-amber-400 font-bold">DEMO</span> utilize algorithmic heuristics (adaptive contour thresholding and texture variance) to demonstrate pipeline execution without fabricating trained neural weights. Models labeled <span className="text-rose-400 font-bold">BLOCKED</span> require legitimate, field-labeled SSS marine debris datasets prior to operational deployment.
        </p>
      </div>

      {/* Models Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model Name</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Modality</TableHead>
              <TableHead>Maturity Status</TableHead>
              <TableHead>Inference Latency</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-semibold text-slate-200">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-cyan-400 shrink-0" />
                    {m.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-normal max-w-sm mt-0.5">
                    {m.description}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-300">v{m.version}</TableCell>
                <TableCell className="text-xs text-slate-300 font-mono">{m.task}</TableCell>
                <TableCell>
                  <ModalityBadge modality={m.modality} />
                </TableCell>
                <TableCell>
                  <MaturityBadge maturity={m.status} />
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-300">
                  {m.inference_time_ms ? `~${m.inference_time_ms} ms / tile` : "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedModel(m)}
                    className="h-7 text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    View Specs →
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Error Analysis & Failure Taxonomy Center */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Acoustic Error Analysis & Failure Taxonomy
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-900/60 border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Natural Seabed FP</span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                HIGH RISK
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Rocky outcrops and sand ripples produce high backscatter contours resembling metallic containers.
            </p>
            <div className="text-[10px] text-cyan-400 font-mono">Mitigation: Trailing shadow length ratio</div>
          </Card>

          <Card className="p-4 bg-slate-900/60 border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Low-Contrast Netting</span>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">
                CRITICAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Synthetic monofilament ghost nets yield subtle acoustic reflections that blend into muddy sediment.
            </p>
            <div className="text-[10px] text-cyan-400 font-mono">Mitigation: CLAHE dynamic range expansion</div>
          </Card>

          <Card className="p-4 bg-slate-900/60 border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Acoustic Speckle</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                RESOLVED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Coherent interference creates multiplicative speckle noise triggering false anomaly variance flags.
            </p>
            <div className="text-[10px] text-cyan-400 font-mono">Mitigation: Fast Non-Local Means (h=10)</div>
          </Card>

          <Card className="p-4 bg-slate-900/60 border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Nadir Altitude Blindspot</span>
              <span className="text-[10px] font-mono text-yellow-400 bg-yellow-950/60 px-1.5 py-0.5 rounded border border-yellow-800/40">
                PHYSICAL LIMIT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Directly below the sonar towfish, water column reflection contains zero lateral seabed acoustic returns.
            </p>
            <div className="text-[10px] text-cyan-400 font-mono">Mitigation: Multi-pass swath overlapping (64px)</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
