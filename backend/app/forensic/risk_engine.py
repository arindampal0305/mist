import math
from .fusion import DempsterShaferCombiner

class RiskScoringEngine:
    """
    Multimodal Risk Scoring Engine with Dempster-Shafer Fusion,
    Platt Sigmoid Calibration, and SHAP-style Explainability Attributions.
    """

    @classmethod
    def calculate_risk(
        cls,
        mrz_data: dict,
        tamper_scores: dict,  # {'ela': float, 'copy_move': float, 'mvss': float, 'exif': float}
        face_match_score: float,
        liveness_status: str,
        is_watchlist_match: bool = False
    ) -> dict:
        """
        Computes overall risk score, band, action recommendation, and SHAP attributions.
        """
        # Hard Watchlist Override (Scenario 4)
        if is_watchlist_match:
            return {
                "risk_score": 100,
                "risk_band": "CRITICAL",
                "action_required": "IMMEDIATE_DETAIN",
                "shap_attributions": [
                    {"name": "MHA Security Watchlist Match", "value": 100.0}
                ]
            }

        # 1. Validation Mass Function (Module 2)
        mrz_all_passed = mrz_data.get("doc_passed", True) and mrz_data.get("dob_passed", True) and mrz_data.get("comp_passed", True)
        if mrz_all_passed:
            m_val = {"G": 0.95, "F": 0.00, "U": 0.05}
        else:
            # Check digit failed
            m_val = {"G": 0.00, "F": 0.95, "U": 0.05}

        # 2. Tampering Mass Function (Module 3)
        max_tamper = max(
            tamper_scores.get("ela", 0.0),
            tamper_scores.get("copy_move", 0.0),
            tamper_scores.get("mvss", 0.0),
            tamper_scores.get("exif", 0.0)
        )

        if max_tamper > 0.6:
            m_tam = {"G": 0.05, "F": min(max_tamper + 0.1, 0.95), "U": 0.10}
        elif max_tamper > 0.3:
            m_tam = {"G": 0.40, "F": max_tamper, "U": 0.20}
        else:
            m_tam = {"G": 0.90, "F": 0.00, "U": 0.10}

        # 3. Biometrics Mass Function (Module 4)
        if face_match_score >= 80.0 and liveness_status == "LIVE":
            m_bio = {"G": 0.92, "F": 0.00, "U": 0.08}
        elif face_match_score < 40.0:
            m_bio = {"G": 0.10, "F": 0.85, "U": 0.05}
        else:
            m_bio = {"G": 0.50, "F": 0.30, "U": 0.20}

        # Fuse evidence using Dempster-Shafer Combiner
        fused = DempsterShaferCombiner.fuse_ensemble([m_val, m_tam, m_bio])
        fake_mass = fused.get("F", 0.0)

        # Platt Scaling Sigmoid Calibration: A=5.0, B=-2.5
        platt_input = 5.0 * fake_mass - 2.5
        calibrated_p = 1.0 / (1.0 + math.exp(-platt_input))
        risk_score = int(round(calibrated_p * 100))

        # Risk Band & Recommended Action
        if risk_score < 25:
            risk_band = "LOW"
            action_required = "CLEAR"
        elif risk_score < 60:
            risk_band = "MEDIUM"
            action_required = "SECONDARY_INTERVIEW"
        elif risk_score < 85:
            risk_band = "HIGH"
            action_required = "SECONDARY_INTERVIEW"
        else:
            risk_band = "CRITICAL"
            action_required = "DOCUMENT_RETAINED"

        # Calculate SHAP-style attribution breakdown
        shap_attributions = []

        if not mrz_data.get("doc_passed", True):
            shap_attributions.append({"name": "MRZ Document Number Check Digit", "value": 45.0})
        if not mrz_data.get("dob_passed", True):
            shap_attributions.append({"name": "MRZ Date of Birth Check Digit", "value": 48.0})
        if not mrz_data.get("comp_passed", True):
            shap_attributions.append({"name": "MRZ Composite Checksum", "value": 35.0})

        if tamper_scores.get("ela", 0.0) > 0.4:
            shap_attributions.append({"name": "ELA Compression Discrepancy", "value": round(tamper_scores['ela'] * 40.0, 1)})
        if tamper_scores.get("copy_move", 0.0) > 0.3:
            shap_attributions.append({"name": "Copy-Move Duplicate Region", "value": round(tamper_scores['copy_move'] * 35.0, 1)})
        if tamper_scores.get("mvss", 0.0) > 0.4:
            shap_attributions.append({"name": "MVSS-Net Deep Manipulation Mask", "value": round(tamper_scores['mvss'] * 45.0, 1)})

        if face_match_score < 50.0:
            shap_attributions.append({"name": "Face Mismatch Vector Distance", "value": round((100.0 - face_match_score) * 0.5, 1)})
        elif face_match_score >= 80.0:
            shap_attributions.append({"name": "Face Vector Match", "value": -15.0})

        if liveness_status != "LIVE":
            shap_attributions.append({"name": "Face Liveness Spoof Flag", "value": 50.0})
        else:
            shap_attributions.append({"name": "Liveness Verification", "value": -10.0})

        if mrz_all_passed:
            shap_attributions.append({"name": "MRZ Checksum Validation", "value": -12.0})

        return {
            "risk_score": risk_score,
            "risk_band": risk_band,
            "action_required": action_required,
            "shap_attributions": shap_attributions
        }
