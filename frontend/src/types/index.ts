export interface MRZField {
  val: string;
  expected: number;
  calculated: number;
  passed: boolean;
}

export interface MRZParsed {
  doc_no: string;
  doc_passed: boolean;
  dob: string;
  dob_passed: boolean;
  expiry?: string;
  expiry_passed?: boolean;
  comp_passed: boolean;
  raw_line1?: string;
  raw_line2?: string;
}

export interface TamperingResult {
  ela_flag: boolean;
  copy_move_flag: boolean;
  mvss_flag?: boolean;
  info?: string;
  tamper_score?: number;
  ela_image_base64?: string;
}

export interface BiometricResult {
  face_match_score: number;
  liveness_status: string;
  arcface_similarity?: number;
  minifasnet_score?: number;
}

export interface ShapAttribution {
  name: string;
  value: number;
}

export interface DempsterShaferMass {
  G: number;
  F: number;
  U: number;
  K?: number;
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
  ds_masses?: DempsterShaferMass;
}

export interface AuditEntry {
  session_id: string;
  officer_id: string;
  action: string;
  justification: string;
  timestamp: string;
}
