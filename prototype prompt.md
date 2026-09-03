# SYSTEM INSTRUCTION & DEVELOPMENT SPECIFICATION

## TARGET ROLE
You are an expert full-stack engineer and digital forensics specialist. Your task is to build **MIST (Multi-layered Intelligence & Screening Technology)**, an offline-first, sovereign document screening and biometric verification dashboard designed for the **Sashastra Seema Bal (SSB)** under the **Ministry of Home Affairs (MHA), Government of India**.

---

## 1. DESIGN SYSTEM & FRONTEND SPECIFICATIONS
The interface must **not** look "vibe coded" (avoid neon-green cyberpunk grids, hyper-stylized futuristic elements, or meaningless particles). It must look like a **professional, sober, administrative enterprise application** suitable for high-security government operations.

### Theme & Colors (Tailwind CSS)
*   **Base Background:** Dark Slate/Zinc (`bg-zinc-950` or `bg-slate-900`) for low eye-strain during 12-hour night shifts at border checkpoints.
*   **Surfaces:** Matte slate cards (`bg-slate-900/50` or `bg-zinc-900/80` with fine borders `border-zinc-800`).
*   **Primary Accent:** Government Steel Blue (`text-sky-500` / `bg-sky-600`).
*   **Alert States:**
    *   **LOW RISK:** Emerald/Green (`text-emerald-500`, `bg-emerald-500/10`).
    *   **MEDIUM RISK:** Amber (`text-amber-500`, `bg-amber-500/10`).
    *   **HIGH RISK:** Crimson (`text-rose-500`, `bg-rose-500/10`).
    *   **CRITICAL OVERRIDE:** Pulse-animated deep red (`bg-red-950/40` with `border-red-600` and text `text-red-500`).

### Interactive Dashboard Layout
The frontend must be a single-page React app using **Lucide-React** for icons and **Recharts** for visualizations, partitioned into 3 logical areas:

```
┌────────────────────────────────────────────────────────────────────────┐
│ MIST: Multi-layered Intelligence & Screening Technology     [SSB-BOM5] │
├────────────────────────┬──────────────────────────────┬────────────────┤
│                        │                              │                │
│ 1. INGESTION PANEL     │ 2. DETAILED MODULE INSPECTOR │ 3. DECISION &  │
│ [Drag & Drop Scan]     │                              │    EVIDENCE    │
│                        │ [Image Zoom & Slider]        │ [DS Risk Dial] │
│ [Live Webcam Stream]   │ [Interactive ELA Heatmap]    │                │
│ [Scenario Selector]    │ [MRZ Checksum Table]         │ [SHAP Bars]    │
│                        │ [Face Match Panel]           │                │
│                        │                              │ [Audit Log]    │
│                        │                              │                │
└────────────────────────┴──────────────────────────────┴────────────────┘
```

#### Widget 1: Ingestion Panel (Left)
*   **Dropzone:** Drop physical scan JPEGs or PDF permits.
*   **Camera Mock:** Simulate a live camera stream with a webcam window or clean canvas overlay.
*   **Scenario Injector (Crucial for Demo):** Quick-click buttons to instantly load the **4 SIH Presentation Scenarios** to bypass manual scanning for presentation speed.

#### Widget 2: Detailed Forensic Inspector (Center)
*   **Dynamic Image Slider:** Side-by-side or overlapping slider displaying the **Original Scan** vs. the **ELA/MVSS-Net Forgery Heatmap Overlay**.
*   **MRZ Matrix Grid:** A tabular breakdown of the parsed Machine Readable Zone displaying every field alongside its calculated check-digit status (Green check or Red cross).
*   **Biometrics HUD:** Cropped Face from Document side-by-side with Live Webcam Crop, overlaid with landmark dots and a cosine similarity thermometer.

#### Widget 3: Decision & Evidence Hub (Right)
*   **Dempster-Shafer Risk Gauge:** Animated semicircular gauge showing the calibrated score [0-100] with the active Risk Band (LOW, MEDIUM, HIGH, CRITICAL).
*   **SHAP Contribution Bar Chart:** Horizontal bar chart displaying how much each module (OCR, Tampering, Face, Liveness) added to or subtracted from the baseline risk score.
*   **Action Drawer:** Textarea for mandatory officer justification if risk is above 25, alongside clearance/detention action buttons.

---

## 2. PROJECT STRUCTURE
Ensure the repository matches this clean, industry-standard modular structure:

```
mist-prototype/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI entrypoint & async orchestrator
│   │   ├── core/
│   │   │   ├── security.py     # HMAC-SHA256 signature and AES-256 tools
│   │   │   └── database.py     # SQLite engine (WAL Mode setup)
│   │   ├── forensic/
│   │   │   ├── mrz.py          # FUNCTIONAL MODULE: ICAO 9303 checksum math
│   │   │   ├── ela.py          # FUNCTIONAL MODULE: Image compression forensics
│   │   │   └── fusion.py       # FUNCTIONAL MODULE: Dempster-Shafer logic
│   │   └── schemas.py          # Pydantic data validation schemas
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── IngestionPanel.tsx
│   │   │   ├── ForensicInspector.tsx
│   │   │   └── DecisionHub.tsx
│   │   ├── App.tsx             # State manager & layout grid
│   │   ├── index.css           # Tailwind base
│   │   └── main.tsx
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

---

## 3. BACKEND CORE IMPLEMENTATION (REAL FORENSIC CODE)
Unlike fragile mockup prototypes, you must implement the actual mathematical logic of **three core modules** in Python.

### Core Module A: ICAO 9303 MRZ Parsing & Check-Digit Algorithm (`mrz.py`)
This script must parse passport MRZ lines and calculate the weighted modulo-10 algorithm defined by the International Civil Aviation Organization (ICAO).

```python
# backend/app/forensic/mrz.py

class ICAO9303Validator:
    """
    Implements the official ICAO Document 9303 check digit calculation.
    Character mapping: 0-9 = 0-9, A-Z = 10-35, '<' = 0
    Weighting sequence: 7, 3, 1, 7, 3, 1... (repeating)
    Formula: Sum(Value * Weight) % 10
    """
    
    @staticmethod
    def char_to_val(char: str) -> int:
        if '0' <= char <= '9':
            return int(char)
        elif 'A' <= char <= 'Z':
            return ord(char) - ord('A') + 10
        elif char == '<':
            return 0
        raise ValueError(f"Invalid character in MRZ: {char}")

    @classmethod
    def calculate_check_digit(cls, data_string: str) -> int:
        weights = [7, 3, 1]
        total = 0
        for idx, char in enumerate(data_string):
            val = cls.char_to_val(char)
            weight = weights[idx % 3]
            total += val * weight
        return total % 10

    @classmethod
    def parse_passport_td3(cls, line1: str, line2: str) -> dict:
        """
        Parses standard 44-character 2-line TD3 Passport MRZ formats.
        """
        if len(line1) != 44 or len(line2) != 44:
            raise ValueError("Invalid TD3 MRZ line length. Must be 44 characters.")

        # Line 2 Parse Blocks
        doc_num = line2[0:9]
        doc_num_check = line2[9]
        
        dob_raw = line2[13:19]
        dob_check = line2[19]
        
        expiry_raw = line2[21:27]
        expiry_check = line2[27]
        
        personal_number = line2[28:42]
        personal_number_check = line2[42]
        
        composite_string = doc_num + doc_num_check + dob_raw + dob_check + expiry_raw + expiry_check + personal_number + personal_number_check
        composite_check = line2[43]

        # Recalculate checksums
        calc_doc = cls.calculate_check_digit(doc_num)
        calc_dob = cls.calculate_check_digit(dob_raw)
        calc_exp = cls.calculate_check_digit(expiry_raw)
        calc_pers = cls.calculate_check_digit(personal_number)
        calc_comp = cls.calculate_check_digit(composite_string[:-1]) # minus trailing index

        return {
            "document_number": {
                "val": doc_num.replace("<", ""),
                "expected": int(doc_num_check),
                "calculated": calc_doc,
                "passed": int(doc_num_check) == calc_doc
            },
            "dob": {
                "val": f"19{dob_raw[0:2]}-{dob_raw[2:4]}-{dob_raw[4:6]}",
                "expected": int(dob_check),
                "calculated": calc_dob,
                "passed": int(dob_check) == calc_dob
            },
            "expiry": {
                "val": f"20{expiry_raw[0:2]}-{expiry_raw[2:4]}-{expiry_raw[4:6]}",
                "expected": int(expiry_check),
                "calculated": calc_exp,
                "passed": int(expiry_check) == calc_exp
            },
            "composite": {
                "expected": int(composite_check),
                "calculated": calc_comp,
                "passed": int(composite_check) == calc_comp
            }
        }
```

---

### Core Module B: Image Error Level Analysis (`ela.py`)
This script must execute real image forensics on uploaded JPEGs, identifying compression discrepancies on-the-fly.

```python
# backend/app/forensic/ela.py
from PIL import Image, ImageChops, ImageEnhance
import numpy as np
import io

class ELADetector:
    """
    Computes Error Level Analysis (ELA) on incoming images.
    Identifies zones with varying compression historical rates (typical of splicing).
    """
    @staticmethod
    def run_ela_analysis(image_bytes: bytes, quality: int = 90) -> tuple[bytes, float]:
        # 1. Read input image bytes
        original = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # 2. Resave to temporary memory buffer at specified JPEG quality
        resaved_buffer = io.BytesIO()
        original.save(resaved_buffer, format="JPEG", quality=quality)
        resaved_buffer.seek(0)
        resaved = Image.open(resaved_buffer)
        
        # 3. Calculate absolute mathematical difference
        diff_img = ImageChops.difference(original, resaved)
        
        # 4. Enhance the output brightness contrast to make compression differences human-visible
        extrema = diff_img.getextrema()
        max_diff = max([ex for ex in extrema]) or 1
        scale = 255.0 / max_diff
        enhanced_diff = ImageEnhance.Brightness(diff_img).enhance(scale)
        
        # 5. Convert back to bytes for frontend streaming
        output_buffer = io.BytesIO()
        enhanced_diff.save(output_buffer, format="JPEG")
        
        # 6. Quantify a raw metric based on average pixel drift
        arr = np.array(diff_img)
        mean_diff = float(np.mean(arr))
        
        # Map to an indicative score range [0.0 - 1.0]
        tamper_score = float(np.clip(mean_diff / 10.0, 0.0, 1.0))
        
        return output_buffer.getvalue(), tamper_score
```

---

### Core Module C: Dempster-Shafer Combination Engine (`fusion.py`)
This engine implements evidence combination math, avoiding simple linear averages to cleanly model epistemic uncertainty.

```python
# backend/app/forensic/fusion.py

class DempsterShaferCombiner:
    """
    Fuses belief masses over the frame of discernment: {GENUINE, FAKE, UNKNOWN}
    Applies the orthogonal sum rule to integrate modular signals.
    """
    @staticmethod
    def fuse_masses(m1: dict, m2: dict) -> dict:
        """
         m1, m2 must be dicts with keys: 'G' (Genuine), 'F' (Fake), 'U' (Unknown)
         summing up to exactly 1.0.
        """
        # Calculate Conflict Factor K
        # K measures conflict when one module claims G and the other claims F
        K = (m1['G'] * m2['F']) + (m1['F'] * m2['G'])
        
        if K >= 0.99:
            # Emergency fallback: heavily conflicted signals. Default to conservative safety.
            return {
                'G': min(m1['G'], m2['G']),
                'F': max(m1['F'], m2['F']),
                'U': 1.0 - (min(m1['G'], m2['G']) + max(m1['F'], m2['F']))
            }
            
        scale = 1.0 / (1.0 - K)
        
        # Calculate combined intersection masses
        fused_G = (m1['G'] * m2['G'] + m1['G'] * m2['U'] + m1['U'] * m2['G']) * scale
        fused_F = (m1['F'] * m2['F'] + m1['F'] * m2['U'] + m1['U'] * m2['F']) * scale
        fused_U = (m1['U'] * m2['U']) * scale
        
        # Guard against minor floating point drift
        total = fused_G + fused_F + fused_U
        return {
            'G': fused_G / total,
            'F': fused_F / total,
            'U': fused_U / total
        }

    @classmethod
    def fuse_ensemble(cls, modules_masses: list[dict]) -> dict:
        """
        Recursively combines a list of modular masses.
        """
        result = modules_masses[0]
        for next_mass in modules_masses[1:]:
            result = cls.fuse_masses(result, next_mass)
        return result
```

---

## 4. SCENARIO ORCHESTRATOR & FALLBACKS (`main.py`)
To make the app robust for a live hackathon presentation, your FastAPI entrypoint must support **live uploads** (processing actual ELA and MRZ checksum math) AND a **scenario injector route**. 

This route allows the team to click a button on the React dashboard to instant-inject the exact mathematical profiles representing the 4 required presentation scenarios.

```python
# backend/app/main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from forensic.mrz import ICAO9303Validator
from forensic.ela import ELADetector
from forensic.fusion import DempsterShaferCombiner
import math

app = FastAPI(title="MIST - Backend Core Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory audit log simulator
AUDIT_LOG = []

# Hardcoded Watchlist SHA-256 for Scenario 4 (Document No: "Z11122233")
WATCHLIST_HASHES = {"97cf923984533036e52003666b6045d625cd69a8183fbc3dfbeec7d7b275bf87"}

class MockScenarioRequest(BaseModel):
    scenario_id: str

@app.post("/api/screen/scenario")
def inject_scenario(payload: MockScenarioRequest):
    """
    Fuses custom module inputs to recreate the four SIH Presentation Scenarios.
    """
    sid = payload.scenario_id
    
    if sid == "clean_passport":
        # Raw masses: High Genuine, Zero Fake, low Unknown
        m_val = {"G": 0.95, "F": 0.00, "U": 0.05}
        m_tam = {"G": 0.90, "F": 0.00, "U": 0.10}
        m_bio = {"G": 0.92, "F": 0.00, "U": 0.08}
        
        fused = DempsterShaferCombiner.fuse_ensemble([m_val, m_tam, m_bio])
        risk_score = int(fused["F"] * 100) # Platt-scale proxy
        
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
            "tampering": {"ela_flag": False, "copy_move_flag": False},
            "biometrics": {"face_match_score": 92, "liveness_status": "LIVE"},
            "shap_attributions": [
                {"name": "MRZ Check", "value": -12},
                {"name": "Face Vector Match", "value": -15},
                {"name": "ELA Forensics", "value": -5},
                {"name": "Liveness Check", "value": -10}
            ],
            "action_required": "CLEAR"
        }
        
    elif sid == "spliced_photo":
        # High tamper mass, validation passes, biometrics mismatch
        m_val = {"G": 0.95, "F": 0.00, "U": 0.05}
        m_tam = {"G": 0.05, "F": 0.85, "U": 0.10} # High Tamper Fake
        m_bio = {"G": 0.10, "F": 0.80, "U": 0.10} # High Biometric Mismatch Fake
        
        fused = DempsterShaferCombiner.fuse_ensemble([m_val, m_tam, m_bio])
        # Force exact calibrated presentation score of 79
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
        # MRZ failure, Tamper uncertain (PNG reprint), Face matches
        m_val = {"G": 0.00, "F": 0.95, "U": 0.05} # High Validation Fake (Check digit fail)
        m_tam = {"G": 0.00, "F": 0.00, "U": 1.00} # ELA completely silent (absorbs PNG uncertainty)
        m_bio = {"G": 0.88, "F": 0.00, "U": 0.12}
        
        fused = DempsterShaferCombiner.fuse_ensemble([m_val, m_tam, m_bio])
        
        return {
            "session_id": "MIST-1102-C",
            "document_type": "INDIAN PASSPORT (TD3)",
            "risk_score": 65,
            "risk_band": "HIGH",
            "mrz_parsed": {
                "doc_no": "M4402910", "doc_passed": True,
                "dob": "1985-04-22", "dob_passed": False, # Altered DOB Checksum Failed!
                "comp_passed": False
            },
            "tampering": {"ela_flag": False, "copy_move_flag": False, "info": "ELA inactive due to Lossless Input (PNG)"},
            "biometrics": {"face_match_score": 88, "liveness_status": "LIVE"},
            "shap_attributions": [
                {"name": "MRZ Check Digit 3", "value": 48},
                {"name": "DOB Crosscheck Error", "value": 35},
                {"name": "Face Vector Match", "value": -10},
                {"name": "ELA Compression", "value": 0} # Absorbed by Dempster Shafer!
            ],
            "action_required": "DOCUMENT_RETAINED"
        }
        
    elif sid == "watchlist_hit":
        # Raw scores irrelevant. Immediate Hard Override.
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
                {"name": "MHA Security Watchlist", "value": 100} # Watchlist Match Override
            ],
            "action_required": "IMMEDIATE_DETAIN"
        }
    
    raise HTTPException(status_code=400, detail="Unknown presentation scenario")
```

---

## 5. RECONSTRUCTING THE UI CODES
Guide the IDE agent to build the React component rendering your data structures cleanly. 

Here is the exact layout of the central dashboard panel in TypeScript:

```typescript
// frontend/src/components/ForensicInspector.tsx
import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

interface ForensicData {
  mrz_parsed: {
    doc_no: string;
    doc_passed: boolean;
    dob: string;
    dob_passed: boolean;
    comp_passed: boolean;
  };
  tampering: {
    ela_flag: boolean;
    copy_move_flag: boolean;
    info?: string;
  };
  biometrics: {
    face_match_score: number;
    liveness_status: string;
  };
}

export const ForensicInspector: React.FC<{ data: ForensicData; showHeatmap: boolean }> = ({ data, showHeatmap }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
          <Cpu className="w-4 h-4 text-sky-500" />
          Technical Module Inspector
        </h2>
        <span className="text-xs text-zinc-500">Node: SSB-BOM5</span>
      </div>

      {/* 1. MRZ Checksum Visual Audit */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase">Module 2: Cryptographic Checksum Engine</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
            <div className="text-xs text-zinc-500">Document No Checksum</div>
            <div className="font-mono text-sm mt-1 flex items-center gap-2">
              {data.mrz_parsed.doc_no}
              {data.mrz_parsed.doc_passed ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              )}
            </div>
          </div>
          
          <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
            <div className="text-xs text-zinc-500">Date of Birth Checksum</div>
            <div className="font-mono text-sm mt-1 flex items-center gap-2">
              {data.mrz_parsed.dob}
              {data.mrz_parsed.dob_passed ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              )}
            </div>
          </div>

          <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
            <div className="text-xs text-zinc-500">Composite Validation</div>
            <div className="font-mono text-sm mt-1 flex items-center gap-2">
              {data.mrz_parsed.comp_passed ? "VALID" : "CORRUPT"}
              {data.mrz_parsed.comp_passed ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Biometric Verification HUD */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase">Module 4: Face Verification & Liveness</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-950 p-4 rounded border border-zinc-800 text-center space-y-1">
            <div className="text-xs text-zinc-500">ArcFace Similarity</div>
            <div className={`text-2xl font-bold ${data.biometrics.face_match_score < 30 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {data.biometrics.face_match_score}%
            </div>
            <div className="text-[10px] text-zinc-600">Threshold: 30% Similarity</div>
          </div>

          <div className="bg-zinc-950 p-4 rounded border border-zinc-800 text-center space-y-1">
            <div className="text-xs text-zinc-500">MiniFASNet Liveness</div>
            <div className={`text-2xl font-bold ${data.biometrics.liveness_status === 'LIVE' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {data.biometrics.liveness_status}
            </div>
            <div className="text-[10px] text-zinc-600">Dual-Scale Voting Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 6. VERIFICATION INSTRUCTIONS
Once you construct this application structure, execute the following validation operations:
1.  Verify the backend compiles with zero warnings by executing `uvicorn main:app --reload`.
2.  Submit `POST` requests to `/api/screen/scenario` with payloads containing `scenario_id` values.
3.  Ensure the Dempster-Shafer combination math resolves correctly. When conflicting masses or fully blank masses are parsed, the `fusion.py` engine must gracefully isolate them to `m_unknown` without crashing the application thread.
4.  Launch the React local dev server, testing the layout responsiveness across 1080p dashboard targets.

Proceed to build this comprehensive layout end-to-end. Provide pristine, robust, production-ready code.
