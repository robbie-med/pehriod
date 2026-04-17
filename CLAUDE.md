# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Development server at localhost:3000
npm run build     # Static export to ./out/ (GitHub Pages)
npm run lint      # ESLint
```

No test suite configured.

## Architecture

**Pehriod** is a fully client-side PWA for period pain management. Zero backend — all data in localStorage. Deployed to GitHub Pages via GitHub Actions on push to `main`. Next.js config uses `output: 'export'` and `basePath: '/pehriod'`.

**Languages:** English + Korean only (`en` | `ko`). All UI strings live in `src/data/translations.ts` as a typed object — no i18n library. Lookup: `t[key]`.

### Data Model (`src/lib/types.ts`)

- **`CycleRecord`** — period start/end dates, per-day flow levels (`spotting/light/medium/heavy`)
- **`DayLog`** — per-date pain level, symptoms, mood, notes
- **`IntakeRecord`** — medication dose with timestamp; persists indefinitely (no auto-purge)
- **`DoseTotals`** — 24hr rolling sums per active ingredient (incl. naproxen)

### Storage keys (`src/lib/storage.ts`)
`pehriod_intake_history`, `pehriod_current_pain`, `pehriod_language`, `pehriod_cycles`, `pehriod_day_logs`

### Tabs & Components

| Tab | Component | Purpose |
|-----|-----------|---------|
| Today | `components/today/TodayDashboard.tsx` | Cycle status, pain log, symptom/mood journal, today's meds |
| Cycle | `components/cycle/CycleTracker.tsx` | Period start/end, month calendar, flow logging, cycle stats + predictions |
| Meds | `components/meds/MedLogger.tsx` | Log doses, real-time safety check, 24hr totals, full history |
| Guide | `components/guide/OTCGuide.tsx` | Comprehensive OTC drug reference + management strategy |
| Settings | `components/settings/SettingsPanel.tsx` | Language switch, data export/clear |

### Business Logic (`src/lib/`)

- **`safetyChecker.ts`** — validates proposed dose: daily limits, drug conflicts (Pamprin Max ↔ Midol), per-medication min interval (ibuprofen 4hr, naproxen 8hr)
- **`cycleCalculator.ts`** — cycle stats, next-period prediction, period date sets for calendar
- **`doseCalculator.ts`** — 24hr rolling sums
- **`doseLimits.ts`** — hard limits: acetaminophen 3000mg, ibuprofen 1200mg, naproxen 660mg

### State hooks (`src/hooks/`)

- **`useMedicationData`** — intakeHistory + doseTotals; no time-based purge (data kept forever)
- **`useCycleData`** — cycles + dayLogs; exposes `startPeriod`, `endPeriod`, `logFlow`, `saveDayLog`
- **`useDoseTotals`** — memoized 24hr ingredient sums

### Medications

6 medications: `ibuprofen`, `naproxen`, `acetaminophen`, `pamprin-multi`, `pamprin-max-energy`, `midol-complete`. Adding a medication requires updating `medications.ts`, `types.ts` (MedicationId), `doseLimits.ts`, and `translations.ts`.
