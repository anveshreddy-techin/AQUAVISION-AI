"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Survey } from "@/lib/types";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { ModalityBadge } from "@/components/common/modality-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Ship, Plus, Search, Layers, Play, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalityFilter, setModalityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchSurveys = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ surveys: Survey[]; total: number }>("/surveys");
      setSurveys(res.surveys || []);
    } catch (err: any) {
      setError(err.message || "Failed to load surveys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const filteredSurveys = surveys.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.area_name && s.area_name.toLowerCase().includes(search.toLowerCase()));
    const matchesModality = modalityFilter === "ALL" || s.sonar_modality === modalityFilter;
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesModality && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Survey Management
            <span className="text-xs font-mono text-slate-400">({surveys.length} total)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Side-Scan Sonar survey missions, ingested image sets, and screening execution.
          </p>
        </div>
        <a href="/surveys/new">
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 gap-1.5 text-xs">
            <Plus className="h-4 w-4" /> Import New Survey
          </Button>
        </a>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search survey name, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="w-32 h-9 text-xs"
          >
            <option value="ALL">All Modalities</option>
            <option value="SSS">SSS Only</option>
            <option value="FLS">FLS Only</option>
            <option value="SAS">SAS Only</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36 h-9 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="REVIEW_READY">REVIEW_READY</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CREATED">CREATED</option>
          </Select>
        </div>
      </div>

      {/* Surveys Table */}
      {loading ? (
        <LoadingState message="Loading surveys..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSurveys} />
      ) : filteredSurveys.length === 0 ? (
        <EmptyState
          title="No surveys match your criteria"
          description="Import a new Side-Scan Sonar survey or adjust your search filters."
          action={
            <a href="/surveys/new">
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-xs">
                Import New Survey
              </Button>
            </a>
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Survey Name</TableHead>
                <TableHead>Modality</TableHead>
                <TableHead>Area / Location</TableHead>
                <TableHead>Frames / Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      <Ship className="h-4 w-4 text-cyan-500 shrink-0" />
                      <a href={`/surveys/${s.id}`} className="hover:text-cyan-400">
                        {s.name}
                      </a>
                    </div>
                    {s.is_demo && (
                      <span className="text-[10px] text-amber-400 font-mono">
                        DEMO SYNTHETIC DATA
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ModalityBadge modality={s.sonar_modality} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-300">
                    {s.area_name || "Unspecified"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs font-mono">
                      <span>
                        {s.processed_frames} / {s.total_frames} frames
                      </span>
                      <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-cyan-500"
                          style={{
                            width: `${
                              s.total_frames > 0
                                ? (s.processed_frames / s.total_frames) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {formatDate(s.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/surveys/${s.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <Eye className="h-3 w-3" /> View
                        </Button>
                      </a>
                      {s.status === "REVIEW_READY" && (
                        <a href={`/review?survey_id=${s.id}`}>
                          <Button size="sm" className="h-7 bg-cyan-700 hover:bg-cyan-600 text-xs">
                            Review
                          </Button>
                        </a>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
