"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Dataset } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/common/loading-state";
import { ModalityBadge } from "@/components/common/modality-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Database, ShieldCheck, AlertCircle, ExternalLink } from "lucide-react";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      setLoading(true);
      try {
        const list = await api.get<Dataset[]>("/datasets");
        setDatasets(list || []);
      } catch (err: any) {
        setError(err.message || "Failed to load dataset registry");
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  if (loading) return <LoadingState message="Querying Dataset Registry..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Database className="h-5 w-5 text-cyan-400" /> Sonar Dataset Provenance Registry
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Cataloged acoustic datasets with strict modality classification (SSS vs FLS) and license tracking.
        </p>
      </div>

      {/* Datasets Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dataset Name</TableHead>
              <TableHead>Modality</TableHead>
              <TableHead>Task Type</TableHead>
              <TableHead>SSS Eligibility</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Known Limitations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datasets.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-semibold text-slate-200">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-cyan-500 shrink-0" />
                    {d.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">{d.source}</div>
                </TableCell>
                <TableCell>
                  <ModalityBadge modality={d.modality} />
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-300">
                  {d.task_type || "Acoustic Detection"}
                </TableCell>
                <TableCell>
                  {d.sss_model_eligible ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      ELIGIBLE (SSS Background)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                      INELIGIBLE (FLS Only)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-400 font-mono">
                  {d.license || "Research Use"}
                </TableCell>
                <TableCell className="text-xs text-slate-400 max-w-xs">
                  {d.limitations || "None noted."}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
