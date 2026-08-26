"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Survey, Candidate, ProcessingJob } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/common/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { ModalityBadge } from "@/components/common/modality-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Ship,
  Layers,
  Crosshair,
  FileText,
  Play,
  ClipboardCheck,
  MapPin,
  Clock,
  Terminal,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function SurveyDetailPage() {
  const params = useParams();
  const surveyId = params?.id;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const fetchSurveyDetails = async () => {
    if (!surveyId) return;
    setLoading(true);
    setError(null);
    try {
      const [surveyData, candidateData, jobData] = await Promise.all([
        api.get<Survey>(`/surveys/${surveyId}`),
        api.get<{ candidates: Candidate[]; total: number }>(`/surveys/${surveyId}/candidates`),
        api.get<ProcessingJob[]>(`/processing/jobs?survey_id=${surveyId}`),
      ]);
      setSurvey(surveyData);
      setCandidates(Array.isArray(candidateData?.candidates) ? candidateData.candidates : []);
      setJobs(Array.isArray(jobData) ? jobData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load survey details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveyDetails();
  }, [surveyId]);

  const handleStartProcessing = async () => {
    if (!survey) return;
    setTriggering(true);
    try {
      await api.post(`/surveys/${survey.id}/process`);
      fetchSurveyDetails();
    } catch (err: any) {
      alert(err.message || "Processing trigger failed");
    } finally {
      setTriggering(false);
    }
  };

  if (loading) return <LoadingState message="Loading Survey Intelligence..." />;
  if (error || !survey) return <ErrorState message={error || "Survey not found"} onRetry={fetchSurveyDetails} />;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Ship className="h-5 w-5 text-cyan-400" /> {survey.name}
            </h1>
            <ModalityBadge modality={survey.sonar_modality} />
            <StatusBadge status={survey.status} />
          </div>
          <p className="text-xs text-slate-400">
            {survey.area_name || "Location unspecified"} • {survey.vessel_name || "Vessel unassigned"} •{" "}
            {formatDate(survey.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {survey.status === "CREATED" || survey.status === "FAILED" ? (
            <Button
              size="sm"
              onClick={handleStartProcessing}
              disabled={triggering}
              className="bg-cyan-600 hover:bg-cyan-500 gap-1.5 text-xs font-semibold"
            >
              <Play className="h-3.5 w-3.5" /> Start Screening Pipeline
            </Button>
          ) : (
            <a href={`/review?survey_id=${survey.id}`}>
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 gap-1.5 text-xs font-semibold">
                <ClipboardCheck className="h-3.5 w-3.5" /> Open Review Queue
              </Button>
            </a>
          )}
          <a href={`/reports`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" /> Generate Report
            </Button>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview & Metrics</TabsTrigger>
          <TabsTrigger value="candidates">Candidates ({candidates.length})</TabsTrigger>
          <TabsTrigger value="processing">Processing Logs</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-slate-900/60">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Frames</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">{survey.total_frames}</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                Processed: {survey.processed_frames}
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/60">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Candidates Found
              </div>
              <div className="text-2xl font-bold text-cyan-400 mt-1">{candidates.length}</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                {candidates.filter((c) => c.priority_category === "CRITICAL").length} Critical
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/60">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Sonar Device</div>
              <div className="text-sm font-semibold text-slate-200 mt-1 truncate">
                {survey.sonar_device || "Standard SSS"}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                Freq: {survey.frequency || "N/A"}
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/60">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                GPS Coordinate Quality
              </div>
              <div className="text-sm font-semibold text-slate-200 mt-1 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-400" />
                {survey.gps_available ? "Available (High)" : "Unavailable"}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                {survey.is_demo ? "Synthetic Coordinates" : "Georeferenced"}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Survey Description & Provenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-300">
              <p>{survey.description || "No mission description provided."}</p>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1 font-mono text-[11px] text-slate-400">
                <div>INGESTION DATE: {formatDate(survey.date || survey.created_at)}</div>
                <div>MODALITY: {survey.sonar_modality} (Side-Scan Sonar)</div>
                <div>DATA INTEGRITY: SHA-256 Checksums Registered</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: CANDIDATES */}
        <TabsContent value="candidates">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Ranked Candidate Regions</span>
                <span className="text-xs font-mono text-slate-400">
                  Priority Sorted (CRITICAL → LOW)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candidates.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  No candidates generated yet. Run the screening pipeline.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Object Classification</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Anomaly Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs text-slate-400">#{c.id}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.priority_category === "CRITICAL"
                                ? "bg-red-950 text-red-300 border border-red-800/80"
                                : c.priority_category === "HIGH"
                                ? "bg-amber-950 text-amber-300 border border-amber-800/80"
                                : c.priority_category === "MEDIUM"
                                ? "bg-yellow-950 text-yellow-300 border border-yellow-800/80"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-800/80"
                            }`}
                          >
                            {c.priority_category} ({c.priority_score.toFixed(2)})
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-200">
                          {c.object_class || "Unclassified Anomaly"}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-400">
                          {c.confidence ? `${(c.confidence * 100).toFixed(0)}%` : "N/A"}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-400">
                          {c.anomaly_score ? c.anomaly_score.toFixed(2) : "N/A"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <a href={`/review?candidate_id=${c.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs">
                              Review
                            </Button>
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PROCESSING LOGS */}
        <TabsContent value="processing">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" /> Pipeline Execution Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No processing runs found.</p>
              ) : (
                jobs.map((j) => (
                  <div
                    key={j.id}
                    className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-cyan-400 font-semibold">JOB #{j.id}</span>
                      <StatusBadge status={j.status} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
                      <div>Items: {j.total_items}</div>
                      <div>Processed: {j.processed_items}</div>
                      <div>Failed: {j.failed_items}</div>
                      <div>Completed: {formatDate(j.completed_at)}</div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
