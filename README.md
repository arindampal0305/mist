# MIST: Multi-layered Intelligence & Screening Technology

> **Smart India Hackathon 2026 Prototype Notice**  
> This project is a working prototype developed for **Smart India Hackathon (SIH) 2026** by Team **Hacksmiths** (Team ID: **138298**).  
> **Problem Statement ID:** PS26188 (Ministry of Home Affairs - MoHA).

### Team Members (Team Hacksmiths - ID: 138298)
* **Arindam Pal (Leader)**
* **Sneha Tiwari**
* **Anuj Upadhayay**
* **Khushi Kumari**
* **Sujal Kumar**
* **Nisha Chabbra**

---

## Project Overview

**MIST (Multi-layered Intelligence & Screening Technology)** is an offline-first document screening and biometric verification terminal designed for border security checkpoints under the Ministry of Home Affairs (MoHA), Government of India.

The application features a single-page React enterprise dashboard styled with Tailwind CSS, Lucide-React icons, and Recharts visualization widgets. The backend is powered by FastAPI and integrates live computer vision, optical character recognition (OCR), digital image forensics, biometric verification, and Dempster-Shafer risk fusion engines.

---

## System Architecture

```
mist/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI entrypoint, live pipeline & scenario routes
│   │   ├── schemas.py          # Pydantic data validation schemas
│   │   ├── core/
│   │   │   ├── security.py     # HMAC-SHA256 & security helpers
│   │   │   └── database.py     # SQLite audit log storage
│   │   └── forensic/
│   │       ├── ocr.py          # Real OCR & layout parsing engine (EasyOCR/Tesseract)
│   │       ├── mrz.py          # ICAO 9303 MRZ check-digit verification
│   │       ├── ela.py          # Error Level Analysis (ELA) JPEG compression forensics
│   │       ├── copy_move.py    # Fridrich DCT block matching copy-move forgery detector
│   │       ├── mvss_net.py     # Deep manipulation noise residual segmentation localizer
│   │       ├── metadata.py     # EXIF container & software forensics
│   │       ├── face.py         # 1:1 ArcFace facial vector similarity matching
│   │       ├── liveness.py     # MiniFASNet passive liveness & anti-spoofing
│   │       ├── fusion.py       # Dempster-Shafer belief mass combination engine
│   │       └── risk_engine.py  # Platt scaling calibrator & SHAP risk attribution engine
│   ├── requirements.txt        # Backend Python dependencies
│   └── tests/                  # Pipeline unit test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── IngestionPanel.tsx     # Drag-and-drop scanner, live webcam, dev tools
│   │   │   ├── ForensicInspector.tsx  # ELA & MVSS heatmaps, MRZ checksums, biometrics HUD
│   │   │   ├── DecisionHub.tsx        # Risk gauge dial, SHAP chart, officer action drawer
│   │   │   ├── ImageSlider.tsx        # Interactive split-view image slider
│   │   │   ├── RiskGauge.tsx          # Radial animated risk dial
│   │   │   └── ShapChart.tsx          # Horizontal SHAP contribution bar chart
│   │   ├── types/
│   │   │   └── index.ts               # Shared TypeScript interface definitions
│   │   ├── App.tsx                    # React state manager and grid layout
│   │   └── main.tsx                   # React root entrypoint
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── index.html
└── README.md
```

---

## Quick Start Guide

### 1. Backend Setup

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The React frontend development server runs on `http://localhost:5173` and proxies API requests to the FastAPI backend at `http://127.0.0.1:8000`.

---

## Key Features & Modules

1. **Live OCR & ICAO 9303 MRZ Engine**: Reads Machine Readable Zone (MRZ) characters directly from uploaded passport images and validates weighted modulo-10 check digits across Document Number, Date of Birth, Expiry, and Composite data fields.
2. **Multi-Layer Digital Forensics**:
   - **Error Level Analysis (ELA)**: Locates JPEG compression differentials and editing artifacts.
   - **Copy-Move Detector**: Performs 16×16 2D DCT block matching to identify duplicated stamps, signatures, or cloned text blocks.
   - **MVSS-Net Localizer**: Generates 256×256 pixel-level manipulation masks using Stegananalytic high-pass noise residual variance.
   - **EXIF Forensics**: Detects software editing signatures (Photoshop, GIMP) and timestamp discrepancies.
3. **Biometrics & Liveness Verification**: Computes 1:1 facial embedding cosine similarity (ArcFace) and evaluates texture spectrum variance (MiniFASNet) for passive anti-spoofing.
4. **Multimodal Risk Engine**: Fuses evidence mass functions using Dempster-Shafer orthogonal combination rule, applies Platt scaling sigmoid calibration to output a 0–100 Risk Score (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and computes dynamic SHAP feature attributions.

---

## API Endpoints

* `POST /api/screen/upload` - Live document screening endpoint (accepts document scan & optional live face image)
* `POST /api/screen/scenario` - Demo injection endpoint for presentation scenarios
* `POST /api/mrz/validate` - Standalone ICAO 9303 MRZ check-digit validation
* `POST /api/audit/log` - Record officer decision and audit justification
* `GET /api/audit/log` - Retrieve persistent local audit log entries
* `GET /api/health` - Backend system health check
