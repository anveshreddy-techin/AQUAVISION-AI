"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ModelVersion } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/common/loading-state";
import { ModalityBadge } from "@/components/common/modality-badge";
import { MaturityBadge } from "@/components/common/maturity-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Brain, ShieldAlert, Cpu, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AIModelsPage() {
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const list = await api.get<ModelVersion[]>("/models");
        setModels(list || []);
      } catch (err: any) {
        setError(err.message || "Failed to load models");
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  if (loading) return <LoadingState message="Loading AI Model Registry..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-cyan-400" /> AI Model Center & Maturity Registry
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Acoustic object detectors, anomaly autoencoders, and scientific maturity certifications.
        </p>
      </div>

      {/* Honesty Contract Banner */}
      <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/20 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
          <ShieldAlert className="h-4 w-4 text-cyan-400" />
          <span>Scientific Integrity Notice (Section 96.26 Honesty Contract)</span>
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
              <TableHead>CPU Inference Time</TableHead>
              <TableHead>Validation Metrics</TableHead>
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
                <TableCell className="text-xs font-mono text-slate-400">
                  Metric unavailable (No SSS test ground-truth)
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
