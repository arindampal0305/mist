import unittest
import io
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from PIL import Image, ImageDraw
import numpy as np

from app.forensic.mrz import ICAO9303Validator
from app.forensic.ela import ELADetector
from app.forensic.copy_move import CopyMoveDetector
from app.forensic.mvss_net import MVSSNetLocalizer
from app.forensic.metadata import MetadataForensics
from app.forensic.ocr import DocumentOCR
from app.forensic.face import FaceVerifier
from app.forensic.liveness import LivenessDetector
from app.forensic.risk_engine import RiskScoringEngine
from app.forensic.fusion import DempsterShaferCombiner

class TestMISTPipeline(unittest.TestCase):

    def setUp(self):
        # Create a synthetic image in memory for testing
        img = Image.new("RGB", (400, 300), color=(240, 240, 240))
        draw = ImageDraw.Draw(img)
        draw.rectangle([50, 50, 150, 150], fill=(100, 150, 200))
        draw.text((60, 60), "PASSPORT INDIA", fill=(0, 0, 0))

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG")
        self.sample_image_bytes = buffer.getvalue()

    def test_mrz_validation(self):
        line1 = "P<INDADITYA<<KUMAR<<<<<<<<<<<<<<<<<<<<<<<<<<"
        # J1234567< -> 9, 910814 -> 9, 280911 -> 5
        line2 = "J1234567<9IND9108149M2809115<<<<<<<<<<<<<<02"
        res = ICAO9303Validator.parse_passport_td3(line1, line2)
        self.assertTrue(res["document_number"]["passed"])
        self.assertTrue(res["dob"]["passed"])
        self.assertTrue(res["composite"]["passed"])

    def test_ela_detector(self):
        bytes_out, score = ELADetector.run_ela_analysis(self.sample_image_bytes)
        self.assertGreater(len(bytes_out), 0)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)

    def test_copy_move_detector(self):
        mask_bytes, score, flag = CopyMoveDetector.detect_copy_move(self.sample_image_bytes)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)

    def test_mvss_net_localizer(self):
        mask_bytes, score, flag = MVSSNetLocalizer.detect_manipulation(self.sample_image_bytes)
        self.assertGreater(len(mask_bytes), 0)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)

    def test_metadata_forensics(self):
        res = MetadataForensics.analyze_metadata(self.sample_image_bytes)
        self.assertIn("score", res)
        self.assertIn("flags", res)

    def test_face_verifier(self):
        score, is_match = FaceVerifier.verify_faces(self.sample_image_bytes, self.sample_image_bytes)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 100.0)

    def test_liveness_detector(self):
        status, score = LivenessDetector.detect_liveness(self.sample_image_bytes)
        self.assertIn(status, ["LIVE", "SPOOF_ATTEMPT_DETECTED"])

    def test_dempster_shafer_fusion(self):
        m1 = {"G": 0.90, "F": 0.00, "U": 0.10}
        m2 = {"G": 0.85, "F": 0.05, "U": 0.10}
        fused = DempsterShaferCombiner.fuse_ensemble([m1, m2])
        self.assertGreater(fused["G"], fused["F"])

    def test_risk_scoring_engine(self):
        mrz_data = {"doc_passed": True, "dob_passed": True, "comp_passed": True}
        tamper_scores = {"ela": 0.1, "copy_move": 0.0, "mvss": 0.0, "exif": 0.0}
        res = RiskScoringEngine.calculate_risk(
            mrz_data=mrz_data,
            tamper_scores=tamper_scores,
            face_match_score=92.0,
            liveness_status="LIVE",
            is_watchlist_match=False
        )
        self.assertEqual(res["risk_band"], "LOW")
        self.assertLess(res["risk_score"], 30)

if __name__ == "__main__":
    unittest.main()
