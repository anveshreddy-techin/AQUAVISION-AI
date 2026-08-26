"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Report, Survey } from "@/lib/types";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { FileText, Download, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Report generation form
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [reportType, setReportType] = useState("FULL_REPORT");
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportList, surveyList] = await Promise.all([
        api.get<Report[]>("/reports"),
        api.get<{ surveys: Survey[]; total: number }>("/surveys"),
      ]);
      setReports(Array.isArray(reportList) ? reportList : []);
      setSurveys(surveyList.surveys || []);
      if (surveyList.surveys?.length > 0 && !selectedSurveyId) {
        setSelectedSurveyId(surveyList.surveys[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedSurveyId) return;
    setGenerating(true);
    try {
      await api.post(`/reports/generate/${selectedSurveyId}`, {
        report_type: reportType,
        title: `Survey Report #${selectedSurveyId}`,
      });
      // Refresh reports list
      const updated = await api.get<Report[]>("/reports");
      setReports(updated);
    } catch (err: any) {
      alert(err.message || "Report generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (reportId: number) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    window.open(`${apiBase}/reports/${reportId}/download`, "_blank");
  };

  if (loading) return <LoadingState message="Loading Survey Reports..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-400" /> Survey Report Generator
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Export verified marine debris findings, executive summaries, and survey telemetry as PDF documents.
        </p>
      </div>

      {/* Generation Bar */}
      <Card className="border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full space-y-1">
            <span className="text-[11px] font-medium text-slate-400">Target Survey</span>
            <Select
              value={selectedSurveyId || ""}
              onChange={(e) => setSelectedSurveyId(Number(e.target.value))}
              className="h-9 text-xs"
            >
              {surveys.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.sonar_modality})
                </option>
              ))}
            </Select>
          </div>

          <div className="w-full sm:w-56 space-y-1">
            <span className="text-[11px] font-medium text-slate-400">Report Scope</span>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="FULL_REPORT">Full Survey Intelligence Report</option>
              <option value="SURVEY_SUMMARY">Executive Summary Only</option>
              <option value="DETECTION_REPORT">High-Priority Findings Only</option>
            </Select>
          </div>

          <div className="w-full sm:w-auto self-end pt-1">
            <Button
              onClick={handleGenerateReport}
              disabled={generating || !selectedSurveyId}
              className="bg-cyan-600 hover:bg-cyan-500 gap-1.5 text-xs h-9 font-semibold w-full sm:w-auto"
            >
              {generating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Compiling PDF...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Generate Report PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Reports Table */}
      {reports.length === 0 ? (
        <EmptyState
          title="No reports generated yet"
          description="Generate your first PDF intelligence report using the toolbar above."
        />
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Survey ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Generated</TableHead>
                <TableHead className="text-right">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold text-slate-200 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                    {r.title}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-300">
                    {r.report_type}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-400">
                    #{r.survey_id}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {formatDate(r.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(r.id)}
                      className="h-7 text-xs gap-1.5 border-slate-700 hover:bg-slate-800"
                    >
                      <Download className="h-3 w-3 text-cyan-400" /> PDF
                    </Button>
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
