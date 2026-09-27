# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Development server at localhost:3000
npm run build     # Static export to ./out/ (GitHub Pages)
npm run lint      # ESLint (flat config, eslint.config.mjs)
npm test          # Vitest, run twice: TZ=Asia/Seoul and TZ=America/Los_Angeles
```

## Architecture

**Pehriod** is a fully client-side PWA for period tracking and period pain management. Zero backend: all data in localStorage. Deployed to GitHub Pages via GitHub Actions on push to `main`. `next.config.js` uses `output: 'export'`. The page renders nothing until mounted (`useSyncExternalStore` gate in `src/app/page.tsx`), so localStorage reads never cause hydration mismatches.

What makes it different: it **measures** instead of guessing.
1. **Blood loss**: each pad/tampon change is one tap and scored with the PBAC chart (Higham 1990); cups log mL. A period ≥ 100 points or ≥ 80 mL is heavy menstrual bleeding.
2. **Pain relief**: an hour after each dose the app asks for relief on the 5-point scale (none … complete). Per-medicine response and NSAID non-response feed the report.
3. **Doctor report**: a plain-language pre-visit questionnaire plus logged data, rendered bilingually (patient language + doctor language). Logged data sits next to each answer and is marked ≠ where they disagree; it never replaces an answer.

**Languages:** `en`, `ko`, `my`, `ar` (RTL). All strings live in `src/data/translations.ts` (`T = typeof en`; every language must have every key). Use `fmt(t.key, { n })` for `{placeholders}` and `tk(t, key)` for keys built at runtime. `translations.ts` is generated from per-language string tables; keep placeholders identical across languages.

**Dates:** always local `YYYY-MM-DD` via `src/lib/dates.ts`. Never use `toISOString()` for a calendar date: it is UTC and shifts the day east of Greenwich.

### Data model (`src/lib/types.ts`)

- `CycleRecord`: period start/end, optional manual `flowByDay`
- `BleedEntry`: one product change (`pad`/`tampon` with `size` 1–5 and `fill` 1–3, `cup` with `ml`, `liner`, `clot`, `flood`)
- `DayLog`: pain 0–10, symptoms, mood, notes, `values` for optional trackers (`missed` = missed work/school)
- `IntakeRecord`: dose with timestamp, `painLevel`, `relief` (undefined = not asked, null = skipped)

### Storage (`src/lib/storage.ts`)

Keys: `pehriod_cycles`, `pehriod_bleeds`, `pehriod_day_logs`, `pehriod_intake_history`, `pehriod_prefs`, `pehriod_visit`, `pehriod_language`, plus theme/backup keys. `migrate()` runs once on load (schema 2 moved legacy calendar events into `DayLog.values`). Clear-all removes every `pehriod_*` key.

### Screens

| Tab | Component | Purpose |
|-----|-----------|---------|
| Today | `components/today/TodayScreen.tsx` | Status, relief questions, one-tap bleed logger, pain, symptoms, trackers |
| Cycle | `components/cycle/CycleScreen.tsx` | Calendar with measured flow, stats, pain by day, tracker trends, period history |
| Meds | `components/meds/MedsScreen.tsx` | One-tap dose logging with undo, safety blocks, 24 h totals, history |
| Visit | `components/visit/VisitScreen.tsx`, `ReportView.tsx` | Questionnaire and printable bilingual report |
| Guide | `components/guide/OTCGuide.tsx` | Long-form reference; the only place for explanatory text |
| Settings | `components/settings/SettingsScreen.tsx` | Gear icon; language, theme, units, trackers, backup |

### Logic (`src/lib/`)

- `pbac.ts`: PBAC scores, FDA tampon absorbency tiers, day flow level
- `period.ts`: auto-start/extend a period on a bleed, end suggestion
- `relief.ts`: pending relief questions, per-med stats, NSAID non-response, early vs onset comparison
- `report.ts`: cycle table and FIGO 2018 flags; `evidence.ts`: logged data per questionnaire answer, with mismatch rules
- `visit.ts`: questionnaire definition; `trackers.ts`: optional trackers (metric storage, unit conversion)
- `safetyChecker.ts`: daily limits (reaching a limit is allowed, exceeding it is blocked), conflicts, min intervals
- `doseLimits.ts`: acetaminophen 3000 mg, ibuprofen 1200 mg, naproxen 660 mg

### Design rules

Tokens in `src/app/globals.css` (`bg`, `raise`, `line`, `t1–t3`, `accent` from hue `--ah`). Dark mode is warm near-black, never blue. Font: Recursive (casual axis) with Gowun Dodum, Padauk, Vazirmatn fallbacks, self-hosted via fontsource. Flat rows and hairlines, no cards or glass. No explanatory sub-text, parentheticals or emoji in UI strings; explanations go in the Guide.

### Medications

6 medications: `ibuprofen`, `naproxen`, `acetaminophen`, `pamprin-multi`, `pamprin-max-energy`, `midol-complete`. Adding one requires `medications.ts`, `types.ts` (`MedicationId`), `doseLimits.ts` if a new ingredient, and translations.
