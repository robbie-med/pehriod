import { CycleRecord, DayLog, IntakeRecord, MedicationId, Relief } from './types';
import { addDays, isoOfTs } from './dates';
import { cycleStartFor } from './period';
import { sortCycles } from './cycleCalculator';

export const RELIEF_ASK_AFTER_MS = 60 * 60 * 1000;
export const RELIEF_ASK_UNTIL_MS = 12 * 60 * 60 * 1000;
export const RELIEF_MIN_RATED = 5;

export const NSAIDS: MedicationId[] = ['ibuprofen', 'naproxen'];

/** Relief at or above "a lot" counts as working. */
const HELPED: Relief = 3;
/** "None" or "a little" counts as poor response. */
const POOR: Relief = 1;

export function pendingRelief(intakes: IntakeRecord[], now: number): IntakeRecord[] {
  return intakes
    .filter((i) => i.relief === undefined && now - i.timestamp >= RELIEF_ASK_AFTER_MS && now - i.timestamp <= RELIEF_ASK_UNTIL_MS)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 2);
}

/** Minutes until the next relief question becomes due, or null if none is waiting. */
export function nextReliefDueMs(intakes: IntakeRecord[], now: number): number | null {
  let soonest: number | null = null;
  for (const i of intakes) {
    if (i.relief !== undefined) continue;
    const due = i.timestamp + RELIEF_ASK_AFTER_MS - now;
    if (due > 0 && (soonest === null || due < soonest)) soonest = due;
  }
  return soonest;
}

export interface ReliefStats {
  rated: number;
  helped: number;
  poor: number;
}

function rated(intakes: IntakeRecord[]): (IntakeRecord & { relief: Relief })[] {
  return intakes.filter((i): i is IntakeRecord & { relief: Relief } => typeof i.relief === 'number');
}

export function reliefStats(intakes: IntakeRecord[], meds: MedicationId[]): ReliefStats {
  const r = rated(intakes.filter((i) => meds.includes(i.medicationId)));
  return {
    rated: r.length,
    helped: r.filter((i) => i.relief >= HELPED).length,
    poor: r.filter((i) => i.relief <= POOR).length,
  };
}

/**
 * NSAID non-response: at least 4 rated NSAID doses across 2+ cycles, 75%+ rated none or a little.
 * About 18% of people with period pain get little or no relief from NSAIDs; that group is worth a
 * clinical look (Oladosu et al. 2018).
 */
export function nsaidNonResponse(intakes: IntakeRecord[], cycles: CycleRecord[]) {
  const starts = sortCycles(cycles).map((c) => c.startDate);
  const r = rated(intakes.filter((i) => NSAIDS.includes(i.medicationId)));
  const poor = r.filter((i) => i.relief <= POOR);
  const cyclesSeen = new Set(poor.map((i) => cycleStartFor(starts, isoOfTs(i.timestamp)) ?? 'none'));
  const flagged = r.length >= 4 && poor.length / r.length >= 0.75 && cyclesSeen.size >= 2;
  return { rated: r.length, poor: poor.length, cycles: cyclesSeen.size, flagged };
}

/**
 * Personal comparison: cycles where an NSAID was first taken before bleeding started ("early")
 * versus on or after the first day ("onset"). Outcome = worst pain on period days 1-2.
 */
export function earlyVsOnset(cycles: CycleRecord[], intakes: IntakeRecord[], dayLogs: DayLog[]) {
  const pain = new Map(dayLogs.filter((l) => l.painLevel != null).map((l) => [l.date, l.painLevel!]));
  const nsaidDates = intakes
    .filter((i) => NSAIDS.includes(i.medicationId))
    .map((i) => isoOfTs(i.timestamp));

  const early: number[] = [];
  const onset: number[] = [];
  for (const c of cycles) {
    const d1 = c.startDate;
    const d2 = addDays(d1, 1);
    const peaks = [pain.get(d1), pain.get(d2)].filter((p): p is number => p != null);
    if (peaks.length === 0) continue;
    const first = nsaidDates.filter((d) => d >= addDays(d1, -2) && d <= d2).sort()[0];
    if (!first) continue;
    (first < d1 ? early : onset).push(Math.max(...peaks));
  }
  const mean = (a: number[]) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null);
  return {
    early: { n: early.length, peak: mean(early) },
    onset: { n: onset.length, peak: mean(onset) },
    ready: early.length >= 2 && onset.length >= 2,
  };
}
