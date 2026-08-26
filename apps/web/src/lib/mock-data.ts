import { OverviewStats, Survey, Candidate, ModelVersion, Dataset } from "./types";

export const MOCK_OVERVIEW_STATS: OverviewStats = {
  active_surveys: 1,
  total_frames: 50,
  frames_screened: 50,
  total_candidates: 15,
  high_priority_candidates: 4,
  total_anomalies: 8,
  pending_reviews: 12,
  completed_reviews: 3,
};

export const MOCK_SURVEYS: Survey[] = [
  {
    id: 1,
    name: "Coastal Swath Survey Alpha (SIH Demo)",
    description: "Synthetic side-scan sonar seabed survey over Chennai Harbor approaches for marine debris and anomaly screening.",
    operator_id: 1,
    date: new Date().toISOString(),
    area_name: "Bay of Bengal - Coastal Swath #4",
    vessel_name: "RV Sagar Kanya",
    sonar_device: "Klein 3000 SSS",
    sonar_modality: "SSS",
    frequency: "450kHz",
    depth_range_min: 15.0,
    depth_range_max: 42.0,
    gps_available: true,
    status: "REVIEW_READY",
    total_files: 5,
    total_frames: 50,
    processed_frames: 50,
    failed_frames: 0,
    is_demo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 1,
    survey_id: 1,
    candidate_type: "COMBINED",
    object_class: "Abandoned Fishing Net",
    confidence: 0.92,
    anomaly_score: 0.88,
    priority_score: 0.94,
    priority_category: "CRITICAL",
    status: "PENDING",
    explanation_json: JSON.stringify([
      "High acoustic shadow and tangled contour texture consistent with synthetic ghost net signature.",
      "Seabed texture anomaly score 0.88 is significantly above local baseline."
    ]),
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    survey_id: 1,
    candidate_type: "DETECTION",
    object_class: "Metallic Container Debris",
    confidence: 0.89,
    anomaly_score: 0.81,
    priority_score: 0.87,
    priority_category: "HIGH",
    status: "PENDING",
    explanation_json: JSON.stringify([
      "High acoustic reflectivity highlight with distinct rectangular acoustic shadow."
    ]),
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    survey_id: 1,
    candidate_type: "COMBINED",
    object_class: "Submerged Pipeline Anomaly",
    confidence: 0.85,
    anomaly_score: 0.76,
    priority_score: 0.82,
    priority_category: "HIGH",
    status: "ACCEPTED",
    explanation_json: JSON.stringify([
      "Linear acoustic feature deviating from natural ripple seabed morphology."
    ]),
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    survey_id: 1,
    candidate_type: "ANOMALY",
    object_class: "Plastic / Synthetic Dump",
    confidence: 0.74,
    anomaly_score: 0.69,
    priority_score: 0.71,
    priority_category: "MEDIUM",
    status: "PENDING",
    explanation_json: JSON.stringify([
      "Localized high texture variance above acoustic seabed baseline."
    ]),
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    survey_id: 1,
    candidate_type: "DETECTION",
    object_class: "Natural Rock Outcrop",
    confidence: 0.62,
    anomaly_score: 0.35,
    priority_score: 0.38,
    priority_category: "LOW",
    status: "REJECTED",
    explanation_json: JSON.stringify([
      "Diffuse acoustic backscatter consistent with natural bathymetric features."
    ]),
    created_at: new Date().toISOString(),
  },
];

export const MOCK_MODELS: ModelVersion[] = [
  {
    id: 1,
    name: "SSS Acoustic Debris Net v1.0",
    version: "1.0.0",
    task: "DETECTION",
    modality: "SSS",
    status: "DEMO",
    metrics_json: JSON.stringify({ mAP50: 0.84, precision: 0.88, recall: 0.82 }),
    description: "Side-scan sonar object detector trained on synthetic acoustic waterfall tiles.",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Seabed Texture Anomaly Autoencoder",
    version: "0.9.2",
    task: "ANOMALY",
    modality: "SSS",
    status: "DEMO",
    metrics_json: JSON.stringify({ AUROC: 0.91, reconstruction_error: 0.042 }),
    description: "Unsupervised texture variance scoring for acoustic anomaly isolation.",
    created_at: new Date().toISOString(),
  },
];

export const MOCK_DATASETS: Dataset[] = [
  {
    id: 1,
    name: "Synthetic SSS Marine Debris Benchmark",
    source: "AquaVision Lab",
    modality: "SSS",
    download_status: "COMPLETED",
    task_type: "DETECTION & ANOMALY",
    image_count: 500,
    limitations: "Precomputed synthetic benchmark under Honesty Protocol specifications.",
    sss_model_eligible: true,
    created_at: new Date().toISOString(),
  },
];

export function getMockResponse(endpoint: string): any {
  if (endpoint.includes("/analytics/overview")) return MOCK_OVERVIEW_STATS;
  if (endpoint.includes("/analytics/summary")) {
    return {
      overview: MOCK_OVERVIEW_STATS,
      priority_breakdown: { CRITICAL: 1, HIGH: 2, MEDIUM: 1, LOW: 1 },
      class_distribution: { "Fishing Net": 4, "Metallic Debris": 5, "Pipeline": 2, "Other": 4 },
      review_status: { PENDING: 12, ACCEPTED: 2, REJECTED: 1, CORRECTED: 0 },
    };
  }
  if (endpoint.startsWith("/surveys")) {
    if (endpoint === "/surveys" || endpoint.startsWith("/surveys?")) {
      return { surveys: MOCK_SURVEYS, total: MOCK_SURVEYS.length };
    }
    return MOCK_SURVEYS[0];
  }
  if (endpoint.startsWith("/candidates")) {
    return { candidates: MOCK_CANDIDATES, total: MOCK_CANDIDATES.length };
  }
  if (endpoint.startsWith("/models")) return MOCK_MODELS;
  if (endpoint.startsWith("/datasets")) return MOCK_DATASETS;
  if (endpoint.startsWith("/review/queue")) {
    return { candidates: MOCK_CANDIDATES.filter((c) => c.status === "PENDING"), total: 4 };
  }
  if (endpoint.startsWith("/maps/layers")) {
    return {
      survey_id: 1,
      center: [13.0827, 80.2707],
      candidates: MOCK_CANDIDATES.map((c, idx) => ({
        ...c,
        latitude: 13.0827 + (idx - 2) * 0.005,
        longitude: 80.2707 + (idx - 2) * 0.004,
      })),
    };
  }
  return { success: true };
}
