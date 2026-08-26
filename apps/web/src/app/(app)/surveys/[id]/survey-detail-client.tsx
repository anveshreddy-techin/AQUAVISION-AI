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

export function SurveyDetailClient() {
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white">{survey.name}</h1>
            <ModalityBadge modality={survey.sonar_modality} />
            <StatusBadge status={survey.status} />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {survey.description || "No description provided."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleStartProcessing}
            disabled={triggering || survey.status === "PROCESSING"}
            className="bg-cyan-600 hover:bg-cyan-500 gap-1.5 text-xs font-semibold"
          >
            <Play className="h-3.5 w-3.5" />
            {triggering ? "Triggering Pipeline..." : "Run Screening Engine"}
          </Button>
          <a href="/review">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <ClipboardCheck className="h-3.5 w-3.5 text-cyan-400" /> Review Candidates
            </Button>
          </a>
        </div>
      </div>

      {/* Survey Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Acoustic Device</span>
          <div className="text-sm font-bold text-slate-200 mt-1">{survey.sonar_device || "Klein 3000 SSS"}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{survey.frequency || "450 kHz"}</div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Depth Range</span>
          <div className="text-sm font-bold text-slate-200 mt-1">
            {survey.depth_range_min ?? 15}m — {survey.depth_range_max ?? 42}m
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Bathymetry Mapped</div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Acquisition Date</span>
          <div className="text-sm font-bold text-slate-200 mt-1">{formatDate(survey.created_at)}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{survey.vessel_name || "RV Sagar Kanya"}</div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Processed Frames</span>
          <div className="text-sm font-bold text-cyan-400 mt-1">
            {survey.processed_frames} / {survey.total_frames}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {survey.is_demo ? "Demo Synthetic" : "Live SSS Stream"}
          </div>
        </Card>
      </div>

      {/* Tabs for Candidates vs Pipeline Jobs */}
      <Tabs defaultValue="candidates" className="w-full">
        <TabsList className="bg-slate-900/80 border border-slate-800">
          <TabsTrigger value="candidates" className="text-xs gap-1.5">
            <Crosshair className="h-3.5 w-3.5" /> Screened Candidates ({candidates.length})
          </TabsTrigger>
          <TabsTrigger value="jobs" className="text-xs gap-1.5">
            <Terminal className="h-3.5 w-3.5" /> Pipeline Execution Jobs ({jobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="mt-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Detector Conf.</TableHead>
                  <TableHead>Anomaly Deviation</TableHead>
                  <TableHead>Review Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">
                      No candidates identified for this survey yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  candidates.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs font-semibold text-cyan-400">
                        #{c.id}
                      </TableCell>
                      <TableCell className="font-medium text-xs text-slate-200">
                        {c.object_class || "Debris Anomaly"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.priority_category === "CRITICAL"
                              ? "bg-red-950 text-red-400 border border-red-800/60"
                              : c.priority_category === "HIGH"
                              ? "bg-amber-950 text-amber-400 border border-amber-800/60"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {c.priority_score.toFixed(2)} ({c.priority_category})
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">
                        {c.confidence ? `${(c.confidence * 100).toFixed(0)}%` : "N/A"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">
                        {c.anomaly_score ? c.anomaly_score.toFixed(2) : "N/A"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <a href={`/review?candidate_id=${c.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-cyan-400 hover:text-cyan-300">
                            Inspect →
                          </Button>
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Operation Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Started At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500">
                      No background processing jobs logged yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs text-slate-400">#{job.id}</TableCell>
                      <TableCell className="font-semibold text-xs text-slate-200">
                        {job.job_type}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                          {job.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">
                        {job.processed_items} / {job.total_items} items
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">
                        {formatDate(job.started_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
