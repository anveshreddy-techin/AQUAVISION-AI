"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Survey } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Ship,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  Play,
  Loader2,
} from "lucide-react";

export default function NewSurveyWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [areaName, setAreaName] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [sonarDevice, setSonarDevice] = useState("Edgetech 4125 SSS (Simulated)");
  const [sonarModality, setSonarModality] = useState<string>("SSS");
  const [frequency, setFrequency] = useState("400/900 kHz");
  const [gpsAvailable, setGpsAvailable] = useState(true);

  // Files & Processing
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [createdSurvey, setCreatedSurvey] = useState<Survey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateSurvey = async () => {
    if (!name.trim()) {
      setError("Please enter a survey name.");
      return;
    }
    setError(null);
    try {
      const res = await api.post<Survey>("/surveys", {
        name,
        description,
        area_name: areaName,
        vessel_name: vesselName,
        sonar_device: sonarDevice,
        sonar_modality: sonarModality,
        frequency,
        gps_available: gpsAvailable,
      });
      setCreatedSurvey(res);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to create survey");
    }
  };

  const handleFileUpload = async () => {
    if (!createdSurvey || files.length === 0) {
      setError("Please select at least one sonar image to upload.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append("files", f);
      });

      await api.postFormData(`/surveys/${createdSurvey.id}/upload-batch`, formData);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleStartProcessing = async () => {
    if (!createdSurvey) return;
    setError(null);
    try {
      await api.post(`/surveys/${createdSurvey.id}/process`);
      router.push(`/surveys/${createdSurvey.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to trigger processing pipeline");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Ship className="h-5 w-5 text-cyan-400" /> Import New Sonar Survey
        </h1>
        <div className="flex items-center gap-4 mt-4 text-xs font-medium">
          <div
            className={`flex items-center gap-2 ${
              step >= 1 ? "text-cyan-400 font-semibold" : "text-slate-500"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] ${
                step >= 1 ? "bg-cyan-950 border border-cyan-500" : "bg-slate-800"
              }`}
            >
              1
            </span>
            Metadata
          </div>
          <div className="h-[1px] w-8 bg-slate-800" />
          <div
            className={`flex items-center gap-2 ${
              step >= 2 ? "text-cyan-400 font-semibold" : "text-slate-500"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] ${
                step >= 2 ? "bg-cyan-950 border border-cyan-500" : "bg-slate-800"
              }`}
            >
              2
            </span>
            Upload Imagery
          </div>
          <div className="h-[1px] w-8 bg-slate-800" />
          <div
            className={`flex items-center gap-2 ${
              step >= 3 ? "text-cyan-400 font-semibold" : "text-slate-500"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] ${
                step >= 3 ? "bg-cyan-950 border border-cyan-500" : "bg-slate-800"
              }`}
            >
              3
            </span>
            Pipeline Screening
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Operation Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* STEP 1: METADATA */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">1. Mission & Sonar Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Survey Name *</label>
              <Input
                placeholder="e.g. Mission Bay Debris Assessment 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Sonar Modality</label>
                <Select value={sonarModality} onChange={(e) => setSonarModality(e.target.value)}>
                  <option value="SSS">Side-Scan Sonar (SSS) - Primary</option>
                  <option value="FLS">Forward-Looking Sonar (FLS) - Auxiliary</option>
                  <option value="SAS">Synthetic Aperture Sonar (SAS)</option>
                  <option value="OTHER">Other Acoustic Modality</option>
                </Select>
                <p className="text-[10px] text-slate-500">
                  Modality affects preprocessing parameters and model selection.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Area / Location Name</label>
                <Input
                  placeholder="e.g. Bay Sector Alpha, Coastal Shelf"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Vessel Name</label>
                <Input
                  placeholder="e.g. R/V Sagar Nidhi"
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Sonar Device Model</label>
                <Input
                  placeholder="e.g. Klein 3000 / Edgetech 4125"
                  value={sonarDevice}
                  onChange={(e) => setSonarDevice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Mission Description</label>
              <Textarea
                placeholder="Notes on survey area, objectives, environmental conditions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={handleCreateSurvey} className="bg-cyan-600 hover:bg-cyan-500 gap-1.5 text-xs">
                Proceed to Imagery Upload <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: FILE UPLOAD */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              2. Upload Sonar Imagery for {createdSurvey?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-700/80 rounded-xl p-8 text-center bg-slate-950/40 hover:bg-slate-900/40 transition-colors">
              <Upload className="h-10 w-10 text-cyan-500 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-200">
                Drag and drop sonar image frames here
              </h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Supported formats: PNG, JPG, TIFF, Sonar waterfalls.
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles(Array.from(e.target.files));
                  }
                }}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors shadow-sm">
                Select Files from Disk
              </label>
            </div>

            {files.length > 0 && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2">
                <div className="text-xs font-semibold text-slate-300">
                  Selected Files ({files.length}):
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 text-xs font-mono text-slate-400">
                  {files.slice(0, 10).map((f, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate max-w-xs">{f.name}</span>
                      <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ))}
                  {files.length > 10 && (
                    <div className="text-[11px] text-cyan-500">
                      + {files.length - 10} more files...
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <Button
                onClick={handleFileUpload}
                disabled={files.length === 0 || uploading}
                className="bg-cyan-600 hover:bg-cyan-500 gap-1.5 text-xs"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Ingesting Sonar Data...
                  </>
                ) : (
                  <>
                    Upload & Register Files <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: PIPELINE EXECUTION */}
      {step === 3 && (
        <Card className="border-cyan-800/40 bg-cyan-950/10">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-cyan-300">
              <CheckCircle className="h-4 w-4 text-cyan-400" />
              Survey Successfully Ingested & Ready for AI Screening
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs text-slate-300 space-y-2">
              <p>
                The files have been registered with SHA-256 checksums and indexed as survey frames.
              </p>
              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Survey ID:</span>
                  <span className="text-slate-200">{createdSurvey?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Modality:</span>
                  <span className="text-cyan-400 font-bold">{createdSurvey?.sonar_modality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pipeline Stages:</span>
                  <span className="text-slate-200">
                    Tiling → CLAHE → Detection → Anomaly → Ranking
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={handleStartProcessing}
                className="bg-cyan-600 hover:bg-cyan-500 gap-1.5 text-xs font-semibold"
              >
                <Play className="h-3.5 w-3.5" /> Launch Automated Screening Pipeline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
