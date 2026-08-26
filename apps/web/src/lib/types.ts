export type RoleType = "admin" | "researcher" | "field_operator";

export type SonarModality = "SSS" | "FLS" | "SAS" | "OTHER";

export type SurveyStatus = 
  | "CREATED"
  | "INGESTING"
  | "PROCESSING"
  | "REVIEW_READY"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "ARCHIVED";

export type CandidateType = "DETECTION" | "ANOMALY" | "COMBINED";

export type PriorityCategory = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type CandidateStatus = 
  | "PENDING"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "CORRECTED"
  | "UNCERTAIN";

export type ReviewAction =
  | "ACCEPT"
  | "REJECT"
  | "CORRECT"
  | "UNCERTAIN"
  | "NATURAL_FEATURE"
  | "POTENTIAL_DEBRIS"
  | "POTENTIAL_GEAR"
  | "ADD_NOTE";

export type ModelMaturity = "DEMO" | "EXPERIMENTAL" | "VALIDATED" | "RETIRED" | "BLOCKED";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: RoleType;
  organization?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface Survey {
  id: number;
  name: string;
  description?: string | null;
  operator_id: number;
  date?: string | null;
  area_name?: string | null;
  vessel_name?: string | null;
  sonar_device?: string | null;
  sonar_modality: SonarModality;
  frequency?: string | null;
  depth_range_min?: number | null;
  depth_range_max?: number | null;
  gps_available: boolean;
  status: SurveyStatus;
  total_files: number;
  total_frames: number;
  processed_frames: number;
  failed_frames: number;
  is_demo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SurveyFrame {
  id: number;
  survey_id: number;
  file_id: number;
  sequence_index: number;
  frame_path: string;
  width?: number | null;
  height?: number | null;
}

export interface SurveyTile {
  id: number;
  frame_id: number;
  survey_id: number;
  tile_index: number;
  x_offset: number;
  y_offset: number;
  width: number;
  height: number;
  tile_path: string;
}

export interface Candidate {
  id: number;
  survey_id: number;
  candidate_type: CandidateType;
  object_class?: string | null;
  confidence?: number | null;
  anomaly_score?: number | null;
  priority_score: number;
  priority_category: PriorityCategory;
  risk?: string | null;
  status: CandidateStatus;
  thumbnail_path?: string | null;
  explanation_json?: string | null;
  source_detections_json?: string | null;
  source_tiles_json?: string | null;
  source_frames_json?: string | null;
  survey_coordinates_json?: string | null;
  evidence_path?: string | null;
  created_at?: string;
}

export interface CandidateEvidence {
  id: number;
  candidate_id: number;
  evidence_type: string;
  file_path: string;
  metadata_json?: string | null;
}

export interface ReviewSession {
  id: number;
  reviewer_id: number;
  survey_id: number;
  started_at: string;
  ended_at?: string | null;
  candidates_reviewed: number;
  accepted: number;
  rejected: number;
  corrected: number;
  uncertain: number;
}

export interface Correction {
  id: number;
  candidate_id: number;
  reviewer_id: number;
  action: ReviewAction;
  original_prediction?: string | null;
  reviewed_label?: string | null;
  original_status: string;
  new_status: string;
  reason?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface ReviewStats {
  total_candidates: number;
  reviewed: number;
  pending: number;
  accepted: number;
  rejected: number;
  corrected: number;
  uncertain: number;
  review_completion_pct: number;
}

export interface ProcessingJob {
  id: number;
  survey_id: number;
  job_type: string;
  status: string;
  total_items: number;
  processed_items: number;
  failed_items: number;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  created_at?: string;
}

export interface ModelVersion {
  id: number;
  name: string;
  version: string;
  task: string;
  modality: SonarModality;
  classes_json?: string | null;
  status: ModelMaturity;
  inference_time_ms?: number | null;
  metrics_json?: string | null;
  description?: string | null;
  created_at?: string;
}

export interface Dataset {
  id: number;
  name: string;
  source: string;
  url?: string | null;
  modality: SonarModality;
  license?: string | null;
  version?: string | null;
  download_status: string;
  task_type?: string | null;
  image_count?: number | null;
  limitations?: string | null;
  sss_model_eligible: boolean;
  created_at?: string;
}

export interface Report {
  id: number;
  survey_id: number;
  report_type: string;
  title: string;
  file_path?: string | null;
  status: string;
  model_version_info?: string | null;
  created_at?: string;
  completed_at?: string | null;
}

export interface OverviewStats {
  active_surveys: number;
  total_frames: number;
  frames_screened: number;
  total_candidates: number;
  high_priority_candidates: number;
  total_anomalies: number;
  pending_reviews: number;
  completed_reviews: number;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: "INFO" | "WARNING" | "SUCCESS" | "ERROR" | "HIGH_PRIORITY";
  is_read: boolean;
  entity_type?: string | null;
  entity_id?: string | null;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details_json?: string | null;
  created_at: string;
}
