from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from datetime import datetime

from .forensic.mrz import ICAO9303Validator
from .forensic.ela import ELADetector
from .forensic.fusion import DempsterShaferCombiner
from .schemas import MockScenarioRequest, AuditEntry
from .core.database import insert_audit_entry, get_audit_entries

from .face.detector import FaceDetector
from .face.matcher import FaceMatcher
from .face.liveness import LivenessDetector


app = FastAPI(title="MIST - Backend Core Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUDIT_LOG: list = []

WATCHLIST_HASHES = {
    "97cf923984533036e52003666b6045d625cd69a8183fbc3dfbeec7d7b275bf87"
}

DOCUMENT_FACE_ENCODINGS = {}


@app.post("/api/screen/scenario")
def inject_scenario(payload: MockScenarioRequest):
    sid = payload.scenario_id

    if sid == "clean_passport":
        m_val = {"G": 0.95, "F": 0.00, "U": 0.05}
        m_tam = {"G": 0.90, "F": 0.00, "U": 0.10}
        m_bio = {"G": 0.92, "F": 0.00, "U": 0.08}

        DempsterShaferCombiner.fuse_ensemble(
            [m_val, m_tam, m_bio]
        )

        return {
            "session_id": "MIST-9022-A",
            "document_type": "INDIAN PASSPORT (TD3)",
            "risk_score": 11,
            "risk_band": "LOW",
            "mrz_parsed": {
                "doc_no": "J1234567",
                "doc_passed": True,
                "dob": "1991-08-14",
                "dob_passed": True,
                "comp_passed": True
            },
            "tampering": {
                "ela_flag": False,
                "copy_move_flag": False
            },
            "biometrics": {
                "face_match_score": 92,
                "liveness_status": "LIVE"
            },
            "shap_attributions": [
                {"name": "MRZ Check", "value": -12},
                {"name": "Face Vector Match", "value": -15},
                {"name": "ELA Forensics", "value": -5},
                {"name": "Liveness Check", "value": -10}
            ],
            "action_required": "CLEAR"
        }

    elif sid == "spliced_photo":
        m_val = {"G": 0.95, "F": 0.00, "U": 0.05}
        m_tam = {"G": 0.05, "F": 0.85, "U": 0.10}
        m_bio = {"G": 0.10, "F": 0.80, "U": 0.10}

        DempsterShaferCombiner.fuse_ensemble(
            [m_val, m_tam, m_bio]
        )

        return {
            "session_id": "MIST-4081-B",
            "document_type": "INDIAN PASSPORT (TD3)",
            "risk_score": 79,
            "risk_band": "HIGH",
            "mrz_parsed": {
                "doc_no": "A4091823",
                "doc_passed": True,
                "dob": "1988-12-04",
                "dob_passed": True,
                "comp_passed": True
            },
            "tampering": {
                "ela_flag": True,
                "copy_move_flag": False,
                "mvss_flag": True
            },
            "biometrics": {
                "face_match_score": 19,
                "liveness_status": "LIVE"
            },
            "shap_attributions": [
                {"name": "MRZ Check", "value": -5},
                {"name": "Face Vector Match", "value": 45},
                {"name": "ELA Forensics", "value": 34},
                {"name": "Liveness Check", "value": -8}
            ],
            "action_required": "SECONDARY_INTERVIEW"
        }

    elif sid == "dob_alteration":
        m_val = {"G": 0.00, "F": 0.95, "U": 0.05}
        m_tam = {"G": 0.00, "F": 0.00, "U": 1.00}
        m_bio = {"G": 0.88, "F": 0.00, "U": 0.12}

        DempsterShaferCombiner.fuse_ensemble(
            [m_val, m_tam, m_bio]
        )

        return {
            "session_id": "MIST-1102-C",
            "document_type": "INDIAN PASSPORT (TD3)",
            "risk_score": 65,
            "risk_band": "HIGH",
            "mrz_parsed": {
                "doc_no": "M4402910",
                "doc_passed": True,
                "dob": "1985-04-22",
                "dob_passed": False,
                "comp_passed": False
            },
            "tampering": {
                "ela_flag": False,
                "copy_move_flag": False,
                "info": "ELA inactive due to Lossless Input (PNG)"
            },
            "biometrics": {
                "face_match_score": 88,
                "liveness_status": "LIVE"
            },
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
                "doc_no": "Z11122233",
                "doc_passed": True,
                "dob": "1972-11-20",
                "dob_passed": True,
                "comp_passed": True
            },
            "tampering": {
                "ela_flag": False,
                "copy_move_flag": False
            },
            "biometrics": {
                "face_match_score": 90,
                "liveness_status": "LIVE"
            },
            "shap_attributions": [
                {
                    "name": "MHA Security Watchlist",
                    "value": 100
                }
            ],
            "action_required": "IMMEDIATE_DETAIN"
        }

    raise HTTPException(
        status_code=400,
        detail="Unknown presentation scenario"
    )


@app.post("/api/screen/upload")
async def screen_upload(file: UploadFile = File(...)):
    contents = await file.read()

    try:
        output_bytes, tamper_score = ELADetector.run_ela_analysis(
            contents
        )

        encoded = base64.b64encode(
            output_bytes
        ).decode("utf-8")

        return {
            "ela_image_base64": encoded,
            "tamper_score": tamper_score
        }

    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"ELA analysis failed: {str(e)}"
        )


class MRZValidateRequest(BaseModel):
    line1: str
    line2: str


@app.post("/api/mrz/validate")
def mrz_validate(req: MRZValidateRequest):
    try:
        return ICAO9303Validator.parse_passport_td3(
            req.line1,
            req.line2
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ============================================================
# FACE VERIFICATION
# ============================================================

@app.post("/api/face/register-document")
async def register_document_face(
    file: UploadFile = File(...)
):
    """
    Detects and aligns the face from the uploaded document,
    then stores the ArcFace embedding.
    """

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded document is empty"
        )

    try:
        print("\n========== MIST FACE REGISTRATION ==========")
        print("File:", file.filename)
        print("Content type:", file.content_type)
        print("File size:", len(contents), "bytes")

        print("[1] Running FaceDetector.detect_and_align()...")

        (
            image,
            faces,
            primary_face,
            aligned_face
        ) = FaceDetector.detect_and_align(contents)

        print("[1] Face detection completed")
        print("Faces detected:", len(faces) if faces is not None else 0)
        print("Primary face:", primary_face is not None)
        print(
            "Aligned face:",
            None if aligned_face is None else aligned_face.shape
        )

        if faces is None or len(faces) == 0:
            raise HTTPException(
                status_code=422,
                detail=(
                    "No face detected in uploaded document. "
                    "Please upload a clear passport/Aadhaar image "
                    "where the portrait is visible."
                )
            )

        if aligned_face is None:
            raise HTTPException(
                status_code=422,
                detail="Face was detected, but alignment failed"
            )

        print("[2] Running FaceMatcher.create_encoding()...")

        encoding = FaceMatcher.create_encoding(
            aligned_face
        )

        print("[2] Face encoding completed")
        print(
            "Encoding:",
            None if encoding is None else encoding.shape
        )

        if encoding is None:
            raise HTTPException(
                status_code=422,
                detail="Could not generate face encoding"
            )

        verification_id = (
            f"FACE-{len(DOCUMENT_FACE_ENCODINGS) + 1:05d}"
        )

        DOCUMENT_FACE_ENCODINGS[
            verification_id
        ] = encoding

        print("[3] Face registered successfully")
        print("Verification ID:", verification_id)
        print("============================================\n")

        return {
            "success": True,
            "verification_id": verification_id,
            "message": "Document face registered successfully",
            "face_detected": True
        }

    except HTTPException:
        raise

    except ValueError as e:
        print("\n[MIST VALUE ERROR]")
        print(str(e))
        print("====================\n")

        raise HTTPException(
            status_code=422,
            detail=str(e)
        )

    except Exception as e:
        import traceback

        print("\n========== MIST FACE ERROR ==========")
        print("ERROR TYPE:", type(e).__name__)
        print("ERROR:", str(e))
        traceback.print_exc()
        print("=====================================\n")

        raise HTTPException(
            status_code=422,
            detail=(
                f"Document face processing failed: "
                f"{type(e).__name__}: {str(e)}"
            )
        )


@app.post("/api/face/verify")
async def verify_live_face(
    verification_id: str,
    file: UploadFile = File(...)
):
    """
    Detects and aligns the live camera face,
    compares it against the stored document embedding,
    and performs liveness analysis.
    """

    if verification_id not in DOCUMENT_FACE_ENCODINGS:
        raise HTTPException(
            status_code=404,
            detail="Verification session not found"
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Live camera image is empty"
        )

    try:
        (
            live_image,
            live_faces,
            primary_live_face,
            aligned_live_face
        ) = FaceDetector.detect_and_align(
            contents
        )

        if live_faces is None or len(live_faces) == 0:
            raise HTTPException(
                status_code=422,
                detail=(
                    "No face detected in live camera image"
                )
            )

        live_encoding = FaceMatcher.create_encoding(
            aligned_live_face
        )

        if live_encoding is None:
            raise HTTPException(
                status_code=422,
                detail="Could not generate live face encoding"
            )

        document_encoding = DOCUMENT_FACE_ENCODINGS[
            verification_id
        ]

        match_result = FaceMatcher.compare(
            document_encoding,
            live_encoding
        )

        face_match_score = float(
            match_result.get("score", 0)
        )

        face_match_passed = bool(
            match_result.get("passed", False)
        )

        liveness_result = LivenessDetector.check(
            [live_image]
        )

        liveness_score = float(
            liveness_result.get("score", 0)
        )

        liveness_status = liveness_result.get(
            "status",
            "UNKNOWN"
        )

        liveness_passed = bool(
            liveness_result.get("passed", False)
        )

        verified = (
            face_match_passed
            and liveness_passed
        )

        return {
            "success": True,
            "verification_id": verification_id,

            "biometrics": {
                "face_match_score": round(
                    face_match_score,
                    2
                ),
                "face_match_passed": face_match_passed,

                "liveness_score": round(
                    liveness_score,
                    2
                ),
                "liveness_status": liveness_status,
                "liveness_passed": liveness_passed,

                "verified": verified
            },

            "face_match": {
                "score": round(
                    face_match_score,
                    2
                ),
                "similarity": match_result.get(
                    "similarity"
                ),
                "distance": match_result.get(
                    "distance"
                ),
                "threshold": match_result.get(
                    "threshold"
                ),
                "decision": match_result.get(
                    "decision"
                ),
                "passed": face_match_passed
            },

            "liveness": {
                "score": round(
                    liveness_score,
                    2
                ),
                "status": liveness_status,
                "passed": liveness_passed
            },

            "final": {
                "passed": verified,
                "verdict": (
                    "IDENTITY_VERIFIED"
                    if verified
                    else "IDENTITY_VERIFICATION_FAILED"
                )
            }
        }

    except HTTPException:
        raise

    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Face verification failed: {str(e)}"
            )
        )


@app.post("/api/audit/log")
def create_audit_log(entry: AuditEntry):
    entry_dict = entry.model_dump()

    if entry_dict.get("timestamp") is None:
        entry_dict["timestamp"] = datetime.now().isoformat()

    AUDIT_LOG.append(entry_dict)

    try:
        insert_audit_entry(entry_dict)
    except Exception:
        pass

    return {
        "status": "success",
        "total_entries": len(AUDIT_LOG)
    }


@app.get("/api/audit/log")
def get_audit_log():
    if AUDIT_LOG:
        return AUDIT_LOG

    try:
        return get_audit_entries()
    except Exception:
        return []


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "engine": "MIST Backend Core",
        "version": "1.0.0"
    }