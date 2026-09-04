# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 18, TypeScript, Vite, Tailwind CSS, Lucide-React, Recharts, FastAPI, SQLite (WAL mode)

## Users

Sashastra Seema Bal (SSB) border control officers under the Ministry of Home Affairs (MHA), Government of India. Operating during 12-hour shifts at high-security border checkpoints.

## Product Purpose

MIST (Multi-layered Intelligence & Screening Technology) provides an offline-first, sovereign document screening and biometric verification dashboard. It automates forensic document inspection, tampering detection, biometric verification, and evidence-fused risk scoring to assist officers in making clear/detain determinations.

## Positioning

Combines multi-modal document forensics (ICAO 9303 MRZ check-digits, JPEG Error Level Analysis, ArcFace similarity, MiniFASNet anti-spoofing) with Dempster-Shafer belief mass orthogonal fusion rather than naive linear averages, producing explainable SHAP risk attributions and hard watchlist overrides.

## Operating Context

Low eye-strain 12-hour night shifts at border checkpoints. Rapid document scanning (drag-and-drop or camera feed) or instant scenario injection, real-time forensic inspection (ELA overlays, MRZ checksum grids, biometric similarity HUD), and formal officer determination logging with required justification for high-risk flags.

## Capabilities and Constraints

- Offline-first operation without reliance on external cloud APIs.
- Real mathematical processing for ICAO 9303 checksums, PIL compression ELA, and Dempster-Shafer math.
- 4 presentation scenarios: Clean Passport (Low Risk), Photo Splicing (High Risk), DOB Alteration (High Risk), Watchlist Hit (Critical Override).
- Mandatory officer justification logging for composite risk scores > 25.

## Brand Commitments

- Professional, clean, modern enterprise government application.
- Base background: Warm off-white canvas (`#F4F1EC`).
- Card surfaces: Pure white (`#FFFFFF`) with subtle card shadows and generous 16px border radius.
- Primary Accent: Coral (`#E8564A`) for alerts, risk indicators, and interactive highlights.
- Safe/Pass States: Teal (`#2DD4BF`) for validated checksums and low-risk signals.
- Color-coded risk bands: LOW (teal), MEDIUM (amber), HIGH (coral), CRITICAL (coral pulse).
- Typography: Inter for body, monospace for cryptographic data.
- Sidebar-based navigation layout with officer profile.


## Evidence on Hand

- Project prompt specification processed.
- Functional Python backend: `backend/app/main.py`, `mrz.py`, `ela.py`, `fusion.py`, `security.py`, `database.py`.
- Functional React frontend dashboard: `frontend/src/App.tsx`, `IngestionPanel.tsx`, `ForensicInspector.tsx`, `DecisionHub.tsx`, `RiskGauge.tsx`, `ShapChart.tsx`.

## Product Principles

1. Operational Sobriety: The UI must prioritize low eye-strain, clarity, and administrative authority over decorative novelty.
2. Mathematically Grounded Forensics: Risk calculation must reflect true mathematical signals and Dempster-Shafer evidence fusion without arbitrary heuristics.
3. Offline Sovereignty: All verification, database logging, and decision support must function fully offline.
4. Accountability & Auditability: Every screening session and officer override requires explicit, logged justification.

## Accessibility & Inclusion

Designed for 1080p desktop dashboard displays in low-light checkpoint environments, utilizing high-contrast monospace text for cryptographic fields and distinct color-plus-icon status indicators (ShieldCheck/ShieldAlert).
