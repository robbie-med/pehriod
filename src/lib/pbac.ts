// Pictorial Blood loss Assessment Chart (Higham, O'Brien & Shaw, BJOG 1990).
// Pads: 1 / 5 / 20, tampons: 1 / 5 / 10 for lightly stained / moderately soiled / saturated.
// Clots: 1 small, 5 large. A cycle total >= 100 corresponds to > 80 mL blood loss
// (sensitivity 86%, specificity 89% against the alkaline haematin method).
// Menstrual cups are measured directly in mL; 80 mL is the same heavy-bleeding line.

import { BleedEntry, FlowLevel, Fill } from './types';
import { isoOfTs } from './dates';

export const PBAC_HEAVY = 100;
export const CUP_HEAVY_ML = 80;

const POINTS: Record<'pad' | 'tampon', Record<Fill, number>> = {
  pad: { 1: 1, 2: 5, 3: 20 },
  tampon: { 1: 1, 2: 5, 3: 10 },
};

/** US FDA tampon absorbency terms (21 CFR 801.430), grams of fluid. */
export const TAMPON_TIERS = [
  { key: 'light', maxG: 6 },
  { key: 'regular', maxG: 9 },
  { key: 'super', maxG: 12 },
  { key: 'super_plus', maxG: 15 },
  { key: 'ultra', maxG: 18 },
] as const;

export const CUP_CAPACITIES_ML = [15, 20, 25, 30, 40] as const;
export const CUP_FRACTIONS = [0.25, 0.5, 0.75, 1] as const;

export function entryPoints(e: BleedEntry): number {
  if ((e.kind === 'pad' || e.kind === 'tampon') && e.fill) return POINTS[e.kind][e.fill];
  if (e.kind === 'clot') return e.big ? 5 : 1;
  return 0;
}

/** Entries that mean blood, as opposed to spotting on a liner. */
export function isBleeding(e: BleedEntry): boolean {
  return e.kind !== 'liner';
}

export interface BleedSummary {
  score: number;
  ml: number;
  pads: number;
  tampons: number;
  cups: number;
  liners: number;
  clotsSmall: number;
  clotsLarge: number;
  floods: number;
  days: number;
}

export function summarize(entries: BleedEntry[]): BleedSummary {
  const s: BleedSummary = {
    score: 0, ml: 0, pads: 0, tampons: 0, cups: 0, liners: 0,
    clotsSmall: 0, clotsLarge: 0, floods: 0, days: 0,
  };
  const days = new Set<string>();
  for (const e of entries) {
    s.score += entryPoints(e);
    days.add(isoOfTs(e.ts));
    switch (e.kind) {
      case 'pad': s.pads++; break;
      case 'tampon': s.tampons++; break;
      case 'cup': s.cups++; s.ml += e.ml ?? 0; break;
      case 'liner': s.liners++; break;
      case 'clot': if (e.big) s.clotsLarge++; else s.clotsSmall++; break;
      case 'flood': s.floods++; break;
    }
  }
  s.days = days.size;
  return s;
}

export function isHeavy(s: BleedSummary): boolean {
  return s.score >= PBAC_HEAVY || s.ml >= CUP_HEAVY_ML;
}

export function entriesOn(entries: BleedEntry[], date: string): BleedEntry[] {
  return entries.filter((e) => isoOfTs(e.ts) === date);
}

export function entriesBetween(entries: BleedEntry[], start: string, end: string): BleedEntry[] {
  return entries.filter((e) => {
    const d = isoOfTs(e.ts);
    return d >= start && d <= end;
  });
}

const LEVELS: FlowLevel[] = ['spotting', 'light', 'medium', 'heavy'];

/** Display level for one day's entries. Thresholds are a display heuristic, not a clinical scale. */
export function dayFlow(dayEntries: BleedEntry[]): FlowLevel | null {
  if (dayEntries.length === 0) return null;
  const s = summarize(dayEntries);
  if (s.score === 0 && s.ml === 0 && s.floods === 0) return 'spotting';
  const byScore = s.score > 20 ? 3 : s.score > 5 ? 2 : s.score > 0 ? 1 : 0;
  const byMl = s.ml > 15 ? 3 : s.ml > 5 ? 2 : s.ml > 0 ? 1 : 0;
  const level = Math.max(byScore, byMl, s.floods > 0 ? 3 : 0, 1);
  return LEVELS[level];
}
