# MIST: Multi-layered Intelligence & Screening Technology

This project is a prototype developed for Smart India Hackathon 2026.

## Problem Statement Details
* PS ID: 26188
* Title: AI-Based Fake Identity & Document Screening System
* Organization: Ministry of Home Affairs
* Department: Sashastra Seema Bal (SSB), Police II Division
* Category: Software
* Theme: Blockchain & Cybersecurity

## Team Details
* Team Name: Hacksmiths
* Team Members:
  * Arindam Pal
  * Sujal Kumar
  * Sneha Tiwari
  * Anuj Upadhayay
  * Nisha Chhabra
  * Khushi Kumari

---

## Project Overview

MIST (Multi-layered Intelligence & Screening Technology) is an offline-first, sovereign document screening and biometric verification dashboard designed for Sashastra Seema Bal (SSB) under the Ministry of Home Affairs (MHA), Government of India.

The interface is built as a single-page React enterprise application styled with Tailwind CSS, Lucide-React icons, and Recharts visualization widgets. The backend is powered by FastAPI and contains functional forensic algorithms for MRZ check-digit verification, image Error Level Analysis (ELA), and Dempster-Shafer evidence fusion.

---

## System Architecture

```
mist/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI entrypoint, routes and scenario orchestrator
│   │   ├── schemas.py          # Pydantic data validation schemas
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── security.py     # HMAC-SHA256 and AES-256 security helpers
│   │   │   └── database.py     # SQLite engine (WAL Mode setup)
│   │   └── forensic/
│   │       ├── __init__.py
│   │       ├── mrz.py          # ICAO 9303 MRZ parsing and check-digit algorithm
│   │       ├── ela.py          # Error Level Analysis image forensics
│   │       └── fusion.py       # Dempster-Shafer belief combination engine
│   └── requirements.txt        # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── IngestionPanel.tsx     # Ingestion dropzone, camera stream, scenario buttons
│   │   │   ├── ForensicInspector.tsx  # ELA flags, MRZ checksum matrix, biometrics HUD
│   │   │   ├── DecisionHub.tsx        # Risk gauge, SHAP chart, officer action drawer
│   │   │   ├── ImageSlider.tsx        # Side-by-side ELA heatmap overlay
│   │   │   ├── RiskGauge.tsx          # Semicircular animated risk dial
│   │   │   └── ShapChart.tsx          # Horizontal SHAP contribution bar chart
│   │   ├── types/
│   │   │   └── index.ts               # Shared TypeScript interface definitions
│   │   ├── App.tsx                    # State manager and layout grid
│   │   ├── index.css                  # Tailwind base styles and theme
│   │   └── main.tsx                   # React root entrypoint
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── postcss.config.js
│   └── index.html
└── README.md
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend development server runs on `http://localhost:5173` and proxies API requests to `http://127.0.0.1:8000`.

---

## API Endpoints

* `POST /api/screen/scenario` - Inject one of 4 presentation scenarios
* `POST /api/screen/upload` - Upload image scan for ELA tamper analysis
* `POST /api/mrz/validate` - Validate 2-line TD3 MRZ strings using ICAO 9303 checksum math
* `POST /api/audit/log` - Store officer determination and justification
* `GET /api/audit/log` - Retrieve audit log records
* `GET /api/health` - Backend status check

### Presentation Scenarios

* `clean_passport`: Clean passport scan, all validations pass, LOW risk (Score: 11)
* `spliced_photo`: Photo splicing anomaly detected by ELA, face match failure, HIGH risk (Score: 79)
* `dob_alteration`: Date of birth checksum failure in MRZ, HIGH risk (Score: 65)
* `watchlist_hit`: MHA Security Watchlist hash match override, CRITICAL risk (Score: 100)

---

## Core Forensic Modules

1. **ICAO 9303 MRZ Validator** (`backend/app/forensic/mrz.py`): Parses passport MRZ lines and calculates weighted modulo-10 checksums across Document Number, Date of Birth, Expiry Date, and Composite data strings.
2. **Image Error Level Analysis** (`backend/app/forensic/ela.py`): Performs JPEG compression difference analysis on uploaded document scans to locate image editing and splicing artifacts.
3. **Dempster-Shafer Combination Engine** (`backend/app/forensic/fusion.py`): Integrates independent belief masses from verification modules using Dempster-Shafer orthogonal combination to calculate composite risk scores and handle conflicting evidence.
