from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from datetime import datetime
from typing import List, Optional

from .forensic.mrz import ICAO9303Validator
from .forensic.ela import ELADetector
from .forensic.copy_move import CopyMoveDetector
from .forensic.mvss_net import MVSSNetLocalizer
from .forensic.metadata import MetadataForensics
from .forensic.ocr import DocumentOCR
from .forensic.face import FaceVerifier
from .forensic.liveness import LivenessDetector
from .forensic.risk_engine import RiskScoringEngine
from .forensic.fusion import DempsterShaferCombiner

from .schemas import (
    MockScenarioRequest, AuditEntry, ScreeningResponse
)
from .core.security import check_watchlist
from .core.database import insert_audit_entry, get_audit_entries

app = FastAPI(title="MIST - Multimodal Intelligent Screening Terminal Backend Core Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory audit log storage
AUDIT_LOG: list = []

# Watchlist Document Numbers (SHA-256 or raw)
WATCHLIST_DOCS = {"Z11122233", "A99988877"}


@app.post("/api/screen/scenario")
def inject_scenario(payload: MockScenarioRequest):
    """
    Fuses custom module inputs to recreate the four SIH Presentation Scenarios.
    """
    sid = payload.scenario_id

    if sid == "clean_passport":
        return {
            "session_id": "MIST-9022-A",
            "document_type": "INDIAN PASSPORT (TD3)",
            "risk_score": 11,
            "risk_band": "LOW",
            "mrz_parsed": {
                "doc_no": "J1234567", "doc_passed": True,
                "dob": "1991-08-14", "dob_passed": True,
                "comp_passed": True
            },
            "tampering": {"ela_flag": False, "copy_move_flag": False, "mvss_flag": False},
            "biometrics": {"face_match_score": 92, "liveness_status": "LIVE"},
            "shap_attributions": [
                {"name": "MRZ Checksum Validation", "value": -12},
                {"name": "Face Vector Match", "value": -15},
                {"name": "ELA Forensics", "value": -5},
                {"name": "Liveness Check", "value": -10}
            ],
            "action_required": "CLEAR"
        }

    elif sid == "spliced_photo":
        return {
            "session_id": "MIST-4081-B",
            "document_type": "INDIAN PASSPORT (TD3)",
            "risk_score": 79,
            "risk_band": "HIGH",
            "mrz_parsed": {
                "doc_no": "A4091823", "doc_passed": True,
                "dob": "1988-12-04", "dob_passed": True,
                "comp_passed": True
            },
            "tampering": {"ela_flag": True, "copy_move_flag": False, "mvss_flag": True},
            "biometrics": {"face_match_score": 19, "liveness_status": "LIVE"},
            "shap_attributions": [
                {"name": "MRZ Check", "value": -5},
                {"name": "Face Vector Match", "value": 45},
                {"name": "ELA Forensics", "value": 34},
                {"name": "Liveness Check", "value": -8}
            ],
            "action_required": "SECONDARY_INTERVIEW"
        }

    elif sid == "dob_alteration":
        return {
            "session_id": "MIST-1102-C",
            "document_type": "INDIAN PASSPORT (TD3)",
            "risk_score": 65,
            "risk_band": "HIGH",
            "mrz_parsed": {
                "doc_no": "M4402910", "doc_passed": True,
                "dob": "1985-04-22", "dob_passed": False,
                "comp_passed": False
            },
            "tampering": {"ela_flag": False, "copy_move_flag": False, "info": "ELA inactive due to Lossless Input (PNG)"},
            "biometrics": {"face_match_score": 88, "liveness_status": "LIVE"},
            "shap_attributions": [
                {"name": "MRZ Check Digit 3", "value": 48},
                {"name": "DOB Crosscheck Error", "value": 35},
                {"name": "Face Vector Match", "value": -10},
                {"name": "ELA Compression", "value": 0}
            ],
            "action_required": "DOCUMENT_RETAINED"
        }

    elif sid == "watchlist_hit":
        return {
            "session_id": "MIST-6612-F",
            "document_type": "INDIAN PASSPORT (TD3)",
            "risk_score": 100,
            "risk_band": "CRITICAL",
            "mrz_parsed": {
                "doc_no": "Z11122233", "doc_passed": True,
                "dob": "1972-11-20", "dob_passed": True,
                "comp_passed": True
            },
            "tampering": {"ela_flag": False, "copy_move_flag": False},
            "biometrics": {"face_match_score": 90, "liveness_status": "LIVE"},
            "shap_attributions": [
                {"name": "MHA Security Watchlist Match", "value": 100}
            ],
            "action_required": "IMMEDIATE_DETAIN"
        }

    raise HTTPException(status_code=400, detail="Unknown presentation scenario")


@app.post("/api/screen/upload")
async def screen_upload(
    file: UploadFile = File(...),
    face_file: Optional[UploadFile] = File(None)
):
    """
    Live Document Screening Endpoint:
    Accepts uploaded document image & optional face image.
    Executes full 5-layer pipeline (OCR, 5 Forensics Detectors, Dempster-Shafer Fusion, ArcFace, Risk Engine).
    """
    doc_bytes = await file.read()
    face_bytes = await face_file.read() if face_file else None

    try:
        # Module 1: Document OCR & MRZ Checksum Validation
        mrz_data = DocumentOCR.process_document(doc_bytes)

        # Module 2: Digital & Physical Tampering Detectors
        ela_bytes, ela_score = ELADetector.run_ela_analysis(doc_bytes)
        ela_flag = ela_score > 0.45

        cm_bytes, cm_score, cm_flag = CopyMoveDetector.detect_copy_move(doc_bytes)
        mvss_bytes, mvss_score, mvss_flag = MVSSNetLocalizer.detect_manipulation(doc_bytes)
        exif_data = MetadataForensics.analyze_metadata(doc_bytes)

        tamper_scores = {
            "ela": ela_score,
            "copy_move": cm_score,
            "mvss": mvss_score,
            "exif": exif_data["score"]
        }

        # Module 3: Facial Verification & Liveness
        face_match_score, face_match_flag = FaceVerifier.verify_faces(doc_bytes, face_bytes)
        liveness_status, liveness_score = LivenessDetector.detect_liveness(face_bytes)

        # Watchlist Check
        is_watchlist = mrz_data["doc_no"] in WATCHLIST_DOCS or check_watchlist(mrz_data["doc_no"])

        # Module 4: Multimodal Risk Engine with Platt Scaling & SHAP Attributions
        risk_result = RiskScoringEngine.calculate_risk(
            mrz_data=mrz_data,
            tamper_scores=tamper_scores,
            face_match_score=face_match_score,
            liveness_status=liveness_status,
            is_watchlist_match=is_watchlist
        )

        # Encode generated overlay heatmaps to Base64
        orig_b64 = base64.b64encode(doc_bytes).decode("utf-8")
        ela_b64 = base64.b64encode(ela_bytes).decode("utf-8") if ela_bytes else ""
        mvss_b64 = base64.b64encode(mvss_bytes).decode("utf-8") if mvss_bytes else ""
        cm_b64 = base64.b64encode(cm_bytes).decode("utf-8") if cm_bytes else ""

        session_id = f"MIST-{datetime.now().strftime('%M%S')}-L"

        return {
            "session_id": session_id,
            "document_type": "INDIAN PASSPORT (TD3)",
            "risk_score": risk_result["risk_score"],
            "risk_band": risk_result["risk_band"],
            "mrz_parsed": {
                "doc_no": mrz_data["doc_no"],
                "doc_passed": mrz_data["doc_passed"],
                "dob": mrz_data["dob"],
                "dob_passed": mrz_data["dob_passed"],
                "comp_passed": mrz_data["comp_passed"],
                "raw_line1": mrz_data.get("raw_line1", ""),
                "raw_line2": mrz_data.get("raw_line2", "")
            },
            "tampering": {
                "ela_flag": ela_flag,
                "copy_move_flag": cm_flag,
                "mvss_flag": mvss_flag,
                "ela_score": ela_score,
                "tamper_score": round(max(ela_score, cm_score, mvss_score), 2),
                "ela_image_base64": ela_b64,
                "mvss_image_base64": mvss_b64,
                "copy_move_base64": cm_b64
            },
            "biometrics": {
                "face_match_score": face_match_score,
                "liveness_status": liveness_status
            },
            "shap_attributions": risk_result["shap_attributions"],
            "action_required": risk_result["action_required"],
            "original_image_base64": orig_b64,
            "ds_masses": risk_result.get("ds_masses")
        }

    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Live screening pipeline failure: {str(e)}")


class MRZValidateRequest(BaseModel):
    line1: str
    line2: str


@app.post("/api/mrz/validate")
def mrz_validate(req: MRZValidateRequest):
    """Accepts two 44-character MRZ lines, runs ICAO 9303 validation."""
    try:
        return ICAO9303Validator.parse_passport_td3(req.line1, req.line2)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/audit/log")
def create_audit_log(entry: AuditEntry):
    """Records an officer action with justification."""
    entry_dict = entry.model_dump()
    if entry_dict.get("timestamp") is None:
        entry_dict["timestamp"] = datetime.now().isoformat()
    AUDIT_LOG.append(entry_dict)
    try:
        insert_audit_entry(entry_dict)
    except Exception:
        pass
    return {"status": "success", "total_entries": len(AUDIT_LOG)}


@app.get("/api/audit/log")
def get_audit_log():
    """Returns all audit log entries."""
    if AUDIT_LOG:
        return AUDIT_LOG
    try:
        return get_audit_entries()
    except Exception:
        return []


@app.get("/api/health")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "engine": "MIST Backend Core", "version": "2.0.0"}
