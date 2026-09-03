from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MockScenarioRequest(BaseModel):
    scenario_id: str

class MRZParsed(BaseModel):
    doc_no: str
    doc_passed: bool
    dob: str
    dob_passed: bool
    comp_passed: bool

class TamperingResult(BaseModel):
    ela_flag: bool
    copy_move_flag: bool
    mvss_flag: Optional[bool] = None
    info: Optional[str] = None

class BiometricResult(BaseModel):
    face_match_score: float
    liveness_status: str

class ShapAttribution(BaseModel):
    name: str
    value: float

class ScreeningResponse(BaseModel):
    session_id: str
    document_type: str
    risk_score: int
    risk_band: str
    mrz_parsed: MRZParsed
    tampering: TamperingResult
    biometrics: BiometricResult
    shap_attributions: List[ShapAttribution]
    action_required: str

class AuditEntry(BaseModel):
    session_id: str
    officer_id: str
    action: str
    justification: str
    timestamp: Optional[datetime] = None
