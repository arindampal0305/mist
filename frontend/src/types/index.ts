export interface MRZParsed {
  doc_no: string;
  doc_passed: boolean;
  dob: string;
  dob_passed: boolean;
  comp_passed: boolean;
}

export interface TamperingResult {
  ela_flag: boolean;
  copy_move_flag: boolean;
  mvss_flag?: boolean;
  info?: string;
}

export interface BiometricResult {
  face_match_score: number;
  liveness_status: string;
}

export interface ShapAttribution {
  name: string;
  value: number;
}

export interface ScreeningResponse {
  session_id: string;
  document_type: string;
  risk_score: number;
  risk_band: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mrz_parsed: MRZParsed;
  tampering: TamperingResult;
  biometrics: BiometricResult;
  shap_attributions: ShapAttribution[];
  action_required: string;
}

export interface AuditEntry {
  session_id: string;
  officer_id: string;
  action: string;
  justification: string;
  timestamp: string;
}
