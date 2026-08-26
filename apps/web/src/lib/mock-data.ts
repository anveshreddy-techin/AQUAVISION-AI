import {
  OverviewStats,
  Survey,
  Candidate,
  ModelVersion,
  Dataset,
  Report,
  ReviewStats,
  NotificationItem,
  AuditLogItem,
  User,
  SurveyFrame,
  ProcessingJob,
} from "./types";

/* ------------------------------------------------------------------ */
/*  MOCK OVERVIEW STATS                                                */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  MOCK SURVEYS                                                       */
/* ------------------------------------------------------------------ */
export const MOCK_SURVEYS: Survey[] = [
  {
    id: 1,
    name: "Coastal Swath Survey Alpha (SIH Demo)",
    description:
      "Synthetic side-scan sonar seabed survey over Chennai Harbor approaches for marine debris and anomaly screening.",
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

/* ------------------------------------------------------------------ */
/*  MOCK CANDIDATES                                                    */
/* ------------------------------------------------------------------ */
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
      "High acoustic reflectivity highlight with distinct rectangular acoustic shadow.",
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
      "Linear acoustic feature deviating from natural ripple seabed morphology.",
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
      "Localized high texture variance above acoustic seabed baseline.",
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
      "Diffuse acoustic backscatter consistent with natural bathymetric features.",
    ]),
    created_at: new Date().toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  MOCK MODELS                                                        */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  MOCK DATASETS                                                      */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  MOCK REPORTS                                                       */
/* ------------------------------------------------------------------ */
export const MOCK_REPORTS: Report[] = [
  {
    id: 1,
    survey_id: 1,
    report_type: "FULL_SURVEY",
    title: "Survey Alpha – Full Analysis Report",
    status: "COMPLETED",
    model_version_info: "SSS Acoustic Debris Net v1.0",
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  MOCK REVIEW STATS                                                  */
/* ------------------------------------------------------------------ */
export const MOCK_REVIEW_STATS: ReviewStats = {
  total_candidates: 15,
  reviewed: 3,
  pending: 12,
  accepted: 1,
  rejected: 1,
  corrected: 0,
  uncertain: 1,
  review_completion_pct: 20.0,
};

/* ------------------------------------------------------------------ */
/*  MOCK NOTIFICATIONS                                                 */
/* ------------------------------------------------------------------ */
export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    title: "Survey Processing Complete",
    message: "Coastal Swath Survey Alpha has finished SSS tile preprocessing. 50 frames ready for review.",
    notification_type: "SUCCESS",
    is_read: false,
    entity_type: "survey",
    entity_id: "1",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Critical Candidate Detected",
    message: "Priority 0.94 — Abandoned Fishing Net candidate flagged on Swath #4. Immediate review recommended.",
    notification_type: "HIGH_PRIORITY",
    is_read: false,
    entity_type: "candidate",
    entity_id: "1",
    created_at: new Date().toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  MOCK AUDIT LOGS                                                    */
/* ------------------------------------------------------------------ */
export const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 1,
    user_id: 1,
    action: "LOGIN",
    entity_type: "auth",
    entity_id: "1",
    details_json: JSON.stringify({ method: "demo_quick_login", role: "admin" }),
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    user_id: 2,
    action: "SURVEY_CREATED",
    entity_type: "survey",
    entity_id: "1",
    details_json: JSON.stringify({ name: "Coastal Swath Survey Alpha" }),
    created_at: new Date().toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  MOCK USERS                                                         */
/* ------------------------------------------------------------------ */
export const MOCK_USERS: User[] = [
  {
    id: 1,
    email: "admin@aquavision.ai",
    full_name: "AquaVision Admin",
    role: "admin",
    organization: "AquaVision AI Lab",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    email: "researcher@aquavision.ai",
    full_name: "Marine Researcher",
    role: "researcher",
    organization: "Oceanographic Institute",
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  MOCK FRAMES                                                        */
/* ------------------------------------------------------------------ */
export const MOCK_FRAMES: SurveyFrame[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  survey_id: 1,
  file_id: 1,
  sequence_index: i,
  frame_path: `/storage/frames/frame_${String(i).padStart(3, "0")}.png`,
  width: 512,
  height: 512,
}));

/* ------------------------------------------------------------------ */
/*  MOCK PROCESSING JOBS                                               */
/* ------------------------------------------------------------------ */
export const MOCK_PROCESSING_JOBS: ProcessingJob[] = [
  {
    id: 1,
    survey_id: 1,
    job_type: "TILE_PREPROCESS",
    status: "COMPLETED",
    total_items: 50,
    processed_items: 50,
    failed_items: 0,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    survey_id: 1,
    job_type: "DETECTION_INFERENCE",
    status: "COMPLETED",
    total_items: 50,
    processed_items: 50,
    failed_items: 0,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  ANALYTICS MOCK PAYLOADS                                            */
/* ------------------------------------------------------------------ */
const MOCK_ANALYTICS_CANDIDATES = {
  total: 15,
  priority_distribution: { CRITICAL: 1, HIGH: 2, MEDIUM: 1, LOW: 1 },
  by_priority: { CRITICAL: 1, HIGH: 2, MEDIUM: 1, LOW: 1 },
  class_distribution: {
    "Abandoned Fishing Net": 4,
    "Metallic Container Debris": 5,
    "Submerged Pipeline": 2,
    "Plastic / Synthetic": 3,
    "Natural Rock Outcrop": 1,
  },
  by_class: {
    "Abandoned Fishing Net": 4,
    "Metallic Container Debris": 5,
    "Submerged Pipeline": 2,
    "Plastic / Synthetic": 3,
    "Natural Rock Outcrop": 1,
  },
  by_status: { PENDING: 12, ACCEPTED: 1, REJECTED: 1, CORRECTED: 0, UNCERTAIN: 1 },
  avg_confidence: 0.804,
  avg_anomaly_score: 0.698,
};

const MOCK_ANALYTICS_REVIEWS = {
  total_reviewed: 3,
  total_pending: 12,
  completion_pct: 20.0,
  avg_review_time_sec: 45,
  review_stats: {
    total_candidates: 15,
    reviewed: 3,
    pending: 12,
    accepted: 1,
    rejected: 1,
    corrected: 0,
    uncertain: 1,
    review_completion_pct: 20.0,
  },
  by_action: { ACCEPT: 1, REJECT: 1, UNCERTAIN: 1 },
};

/* ------------------------------------------------------------------ */
/*  UNIVERSAL MOCK ROUTER                                              */
/* ------------------------------------------------------------------ */
export function getMockResponse(endpoint: string): any {
  // Auth endpoints
  if (endpoint.includes("/auth/me")) {
    return MOCK_USERS[0];
  }
  if (endpoint.includes("/auth/login")) {
    return { access_token: "demo-fallback-jwt-token", user: MOCK_USERS[0] };
  }

  // Analytics
  if (endpoint.includes("/analytics/overview")) return MOCK_OVERVIEW_STATS;
  if (endpoint.includes("/analytics/candidates")) return MOCK_ANALYTICS_CANDIDATES;
  if (endpoint.includes("/analytics/reviews")) return MOCK_ANALYTICS_REVIEWS;
  if (endpoint.includes("/analytics/summary")) {
    return {
      overview: MOCK_OVERVIEW_STATS,
      priority_breakdown: { CRITICAL: 1, HIGH: 2, MEDIUM: 1, LOW: 1 },
      class_distribution: { "Fishing Net": 4, "Metallic Debris": 5, Pipeline: 2, Other: 4 },
      review_status: { PENDING: 12, ACCEPTED: 2, REJECTED: 1, CORRECTED: 0 },
    };
  }

  // Notifications
  if (endpoint.startsWith("/notifications")) return MOCK_NOTIFICATIONS;

  // Users
  if (endpoint.startsWith("/users")) return MOCK_USERS;

  // Audit logs
  if (endpoint.startsWith("/audit")) return MOCK_AUDIT_LOGS;

  // Reports
  if (endpoint.startsWith("/reports/generate")) return MOCK_REPORTS[0];
  if (endpoint.startsWith("/reports")) return MOCK_REPORTS;

  // Review
  if (endpoint.includes("/review/stats")) return MOCK_REVIEW_STATS;
  if (endpoint.includes("/review/candidates")) return { success: true, status: "ACCEPTED" };
  if (endpoint.startsWith("/review")) {
    return { candidates: MOCK_CANDIDATES.filter((c) => c.status === "PENDING"), total: 4 };
  }

  // Processing jobs
  if (endpoint.includes("/processing/jobs")) return MOCK_PROCESSING_JOBS;

  // Surveys — must check specific patterns before generic
  if (endpoint.match(/\/surveys\/\d+\/candidates/)) {
    return { candidates: MOCK_CANDIDATES, total: MOCK_CANDIDATES.length };
  }
  if (endpoint.match(/\/surveys\/\d+\/frames/)) {
    return MOCK_FRAMES;
  }
  if (endpoint.match(/\/surveys\/\d+\/upload/)) {
    return { success: true, files_uploaded: 1 };
  }
  if (endpoint.match(/\/surveys\/\d+\/process/)) {
    return { success: true, job_id: 1 };
  }
  if (endpoint.match(/\/surveys\/\d+$/)) {
    return MOCK_SURVEYS[0];
  }
  if (endpoint === "/surveys" || endpoint.startsWith("/surveys?")) {
    return { surveys: MOCK_SURVEYS, total: MOCK_SURVEYS.length };
  }

  // Candidates
  if (endpoint.startsWith("/candidates")) {
    return { candidates: MOCK_CANDIDATES, total: MOCK_CANDIDATES.length };
  }

  // Models
  if (endpoint.startsWith("/models")) return MOCK_MODELS;

  // Datasets
  if (endpoint.startsWith("/datasets")) return MOCK_DATASETS;

  // Maps
  if (endpoint.startsWith("/maps")) {
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

  // Generic fallback
  return { success: true };
}
