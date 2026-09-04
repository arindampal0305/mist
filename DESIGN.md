---
name: MIST Design System
description: Sovereign Document Screening Dashboard inspired by modern fintech dashboards
colors:
  canvas: "#F4F1EC"
  surface: "#FFFFFF"
  navy: "#1E1E2F"
  navy-light: "#3A3A52"
  coral: "#E8564A"
  coral-deep: "#D14A3F"
  teal: "#2DD4BF"
  teal-deep: "#14B8A6"
  mint: "#D1FAE5"
  blush: "#FEE2E2"
  amber: "#F59E0B"
  amber-wash: "#FEF3C7"
typography:
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  md: "8px"
  lg: "12px"
  xl: "16px"
  "2xl": "20px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: MIST

## Overview

**Creative North Star: "The Sovereign Inspection Desk"**

MIST is a warm, light-themed enterprise screening dashboard inspired by modern fintech dashboard aesthetics. It replaces dark cyberpunk tropes with a clean off-white canvas, generous rounded corners, subtle card shadows, and a strict coral/teal semantic color vocabulary. The interface feels trustworthy, calm, and professional while remaining information-dense enough for 12-hour border checkpoint shifts.

Key Characteristics:
- Warm off-white canvas background (`#F4F1EC`) with pure white card surfaces (`#FFFFFF`).
- Deep navy text (`#1E1E2F`) for clear readability in any lighting condition.
- Coral (`#E8564A`) for alerts, risk indicators, and primary accents.
- Teal (`#2DD4BF`) for safe/pass states and positive signals.
- Generous border radius (12-16px on cards) with subtle card shadows.
- Sidebar navigation layout with officer profile and scenario controls.

## Colors

Restrained palette with clear semantic separation for risk states.

### Primary
- **Coral** (`#E8564A`): Primary accent for alerts, risk indicators, interactive highlights, and branding.

### Secondary
- **Teal** (`#2DD4BF`): Safe states, pass indicators, low-risk signals, and positive confirmations.

### Neutral
- **Canvas** (`#F4F1EC`): Warm off-white page background.
- **Surface** (`#FFFFFF`): Card and panel backgrounds.
- **Navy** (`#1E1E2F`): Primary heading and body text.
- **Navy Light** (`#3A3A52`): Secondary and muted text at reduced opacity.

### Semantic Washes
- **Mint** (`#D1FAE5`): Light teal wash for pass/safe state backgrounds.
- **Blush** (`#FEE2E2`): Light coral wash for fail/alert state backgrounds.
- **Amber Wash** (`#FEF3C7`): Warning and info notice backgrounds.

## Typography

**Body Font:** Inter (with system-ui fallback)
**Mono Font:** ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas

**Character:** Clean, modern, highly legible sans-serif. Inter provides excellent readability at small sizes for dense dashboard data, with monospace reserved for cryptographic fields and telemetry.

### Hierarchy
- **Display** (800 weight, 1.5rem, tight tracking): Page titles and large numerical scores.
- **Title** (700 weight, 0.875rem): Card headings and section labels.
- **Body** (400 weight, 0.875rem, 1.5 line-height): Standard content text.
- **Label** (500-600 weight, 0.6875rem, uppercase, wide tracking): Section headers and category labels.
- **Data** (400 weight, 0.8125rem, monospace, wide tracking): MRZ strings, hashes, timestamps.

## Layout

Sidebar (260px fixed) + main content area split into center (flexible) and right panel (380px fixed). The sidebar contains branding, officer profile, document scanner, camera mock, and scenario controls. Main content scrolls independently.

## Elevation & Depth

Subtle card shadows (`0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)`) provide gentle lift. No heavy drop shadows or decorative glows. Depth is primarily conveyed through background color layering (canvas vs surface).

## Shapes

- **Cards:** `rounded-2xl` (16px) for major containers.
- **Inner elements:** `rounded-xl` (12px) for status badges, inputs, and sub-cards.
- **Buttons:** `rounded-xl` (12px) with soft hover transitions.
- **Borders:** Thin 1px borders at very low opacity (`border-navy/5` to `border-navy/10`).

## Components

### Buttons
- **Shape:** Generously rounded (12px radius).
- **Primary (Coral):** `bg-coral text-white hover:bg-coral-deep` with `active:scale-[0.97]` press feedback.
- **Semantic Actions:** Teal, amber, or coral washed backgrounds matching the action's risk level.

### Cards
- **Background:** Pure white (`#FFFFFF`).
- **Corner radius:** 16px (`rounded-2xl`).
- **Shadow:** `shadow-card` (subtle, warm).
- **Border:** None or very faint (`border-navy/5`).

### Status Badges
- **Pass:** Teal text on mint wash background (`bg-teal/15 text-teal-deep`).
- **Fail:** Coral text on blush wash background (`bg-coral/15 text-coral`).
- **Shape:** Small rounded pill with icon + text.

### Inputs / Textareas
- **Style:** Canvas background, thin navy/10 border, rounded-xl.
- **Focus:** `border-coral/40` ring.

## Do's and Don'ts

### Do:
- **Do** use warm off-white canvas (`#F4F1EC`) as the page ground, never pure gray or stark white.
- **Do** pair status icons with teal/coral color washes for accessible state indication.
- **Do** maintain generous 12-16px border radius on all card-level containers.

### Don't:
- **Don't** use dark/black backgrounds, neon accents, or cyberpunk grid overlays.
- **Don't** use hard offset shadows (`4px 4px 0`) or decorative gradient text.
- **Don't** reduce border radius below 8px on interactive elements.
