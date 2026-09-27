// What the logs say about a questionnaire answer, and whether the two disagree.

import { BleedEntry, CycleRecord, DayLog, IntakeRecord } from './types';
import { Answers } from './visit';
import { addDays, daysBetween, isoOfTs, todayISO } from './dates';
import { sortCycles } from './cycleCalculator';
import { entriesBetween, isHeavy, summarize } from './pbac';
import { periodOn } from './period';
import { reliefStats } from './relief';
import { MEDICATIONS } from './medications';

export type Logged =
  | { kind: 'date'; value: string }
  | { kind: 'days'; value: number; n: number }
  | { kind: 'range'; value: number; n: number }
  | { kind: 'count'; value: number; of?: number }
  | { kind: 'score'; value: number }
  | { kind: 'minutes'; value: number }
  | { kind: 'relief'; helped: number; rated: number }
  | { kind: 'weight'; value: number };

export interface Evidence {
  logged: Logged;
  /** Key naming what was counted, e.g. 'heavy_cycles'. */
  what: string;
  mismatch: boolean;
}

const RECENT_CYCLES = 6;
const PRODUCTS = new Set(['pad', 'tampon', 'cup']);

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

const num = (a: unknown) => (typeof a === 'number' ? a : null);
const yes = (a: unknown) => a === 'yes';
const no = (a: unknown) => a === 'no';

export function buildEvidence(
  answers: Answers,
  cycles: CycleRecord[],
  bleeds: BleedEntry[],
  dayLogs: DayLog[],
  intakes: IntakeRecord[],
  today: string = todayISO()
): Record<string, Evidence> {
  const out: Record<string, Evidence> = {};
  const sorted = sortCycles(cycles).filter((c) => c.startDate <= today);
  const recent = sorted.slice(-RECENT_CYCLES);

  // Last period start
  const last = sorted[sorted.length - 1];
  if (last) {
    const a = typeof answers.lmp === 'string' && answers.lmp !== 'unsure' ? answers.lmp : null;
    out.lmp = {
      what: 'last_start',
      logged: { kind: 'date', value: last.startDate },
      mismatch: !!a && Math.abs(daysBetween(a, last.startDate)) >= 3,
    };
  }

  // Period length
  const durations = recent.filter((c) => c.endDate).map((c) => daysBetween(c.startDate, c.endDate!) + 1);
  const medDur = median(durations);
  if (medDur !== null) {
    const a = num(answers.duration);
    out.duration = { what: 'median', logged: { kind: 'days', value: medDur, n: durations.length }, mismatch: a !== null && Math.abs(a - medDur) >= 2 };
  }

  // Cycle length and regularity
  const lengths: number[] = [];
  for (let i = Math.max(0, sorted.length - RECENT_CYCLES - 1); i < sorted.length - 1; i++) {
    const l = daysBetween(sorted[i].startDate, sorted[i + 1].startDate);
    if (l > 0 && l < 180) lengths.push(l);
  }
  const medLen = median(lengths);
  if (medLen !== null) {
    const a = num(answers.gap);
    out.gap = { what: 'median', logged: { kind: 'days', value: medLen, n: lengths.length }, mismatch: a !== null && Math.abs(a - medLen) >= 5 };
  }
  if (lengths.length >= 2) {
    const spread = Math.max(...lengths) - Math.min(...lengths);
    out.regular = {
      what: 'spread',
      logged: { kind: 'range', value: spread, n: lengths.length },
      mismatch: (yes(answers.regular) && spread >= 10) || (no(answers.regular) && spread <= 7),
    };
  }

  // Bleeding volume and pattern
  const cycleSummaries = recent.map((c) => summarize(entriesBetween(bleeds, c.startDate, c.endDate ?? today)));
  const measured = cycleSummaries.filter((s) => s.pads + s.tampons + s.cups > 0);
  if (measured.length) {
    const heavy = measured.filter(isHeavy).length;
    out.heavy = {
      what: 'heavy_cycles',
      logged: { kind: 'count', value: heavy, of: measured.length },
      mismatch: (yes(answers.heavy) && heavy === 0) || (no(answers.heavy) && heavy > 0),
    };
  }

  const changes = bleeds.filter((b) => PRODUCTS.has(b.kind)).sort((a, b) => a.ts - b.ts);
  if (changes.length >= 2) {
    let quick = 0;
    let shortest = Infinity;
    for (let i = 1; i < changes.length; i++) {
      if (isoOfTs(changes[i].ts) !== isoOfTs(changes[i - 1].ts)) continue;
      const gap = (changes[i].ts - changes[i - 1].ts) / 60000;
      shortest = Math.min(shortest, gap);
      if (gap <= 120) quick++;
    }
    out.soak = {
      what: 'quick_changes',
      logged: { kind: 'count', value: quick },
      mismatch: (no(answers.soak) && quick >= 2) || (yes(answers.soak) && quick === 0 && changes.length >= 10),
    };
    const night = changes.filter((c) => new Date(c.ts).getHours() < 6).length;
    out.night = {
      what: 'night_changes',
      logged: { kind: 'count', value: night },
      mismatch: (no(answers.night) && night >= 2) || (yes(answers.night) && night === 0 && changes.length >= 10),
    };
  }

  const bigClots = bleeds.filter((b) => b.kind === 'clot' && b.big).length;
  if (bigClots > 0 || bleeds.length > 0) {
    out.clots = { what: 'large_clots', logged: { kind: 'count', value: bigClots }, mismatch: no(answers.clots) && bigClots > 0 };
    const floods = bleeds.filter((b) => b.kind === 'flood').length;
    out.flood = { what: 'floods', logged: { kind: 'count', value: floods }, mismatch: no(answers.flood) && floods > 0 };
    const outside = new Set(bleeds.filter((b) => !periodOn(cycles, isoOfTs(b.ts), today)).map((b) => isoOfTs(b.ts)));
    out.between = { what: 'days_outside', logged: { kind: 'count', value: outside.size }, mismatch: no(answers.between) && outside.size > 0 };
  }

  // Pain
  const painByDate = new Map(dayLogs.filter((l) => l.painLevel != null).map((l) => [l.date, l.painLevel!]));
  let peak: number | null = null;
  for (const c of recent) {
    for (let d = c.startDate; d <= (c.endDate ?? today); d = addDays(d, 1)) {
      const p = painByDate.get(d);
      if (p != null && (peak === null || p > peak)) peak = p;
    }
  }
  if (peak !== null) {
    const a = num(answers.pain_worst);
    out.pain_worst = { what: 'peak', logged: { kind: 'score', value: peak }, mismatch: a !== null && Math.abs(a - peak) >= 3 };
  }

  const lastDone = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  if (lastDone && dayLogs.length) {
    const end = addDays(sorted[sorted.length - 1].startDate, -1);
    const missed = dayLogs.filter((l) => l.date >= lastDone.startDate && l.date <= end && l.values?.missed === true).length;
    const a = num(answers.missed);
    out.missed = { what: 'last_cycle', logged: { kind: 'count', value: missed }, mismatch: a !== null && Math.abs(a - missed) >= 2 };
  }

  const r = reliefStats(intakes, MEDICATIONS.map((m) => m.id));
  if (r.rated >= 3) {
    const share = r.helped / r.rated;
    out.meds_help = {
      what: 'doses_helped',
      logged: { kind: 'relief', helped: r.helped, rated: r.rated },
      mismatch: (answers.meds_help === 'yes' && share < 0.25) || (answers.meds_help === 'no' && share >= 0.75) || answers.meds_help === 'none_taken',
    };
  }

  const weights = dayLogs
    .filter((l) => typeof l.values?.weight === 'number')
    .sort((a, b) => b.date.localeCompare(a.date));
  if (weights.length) {
    const w = weights[0].values!.weight as number;
    const a = num(answers.weight);
    out.weight = { what: 'latest', logged: { kind: 'weight', value: w }, mismatch: a !== null && Math.abs(a - w) >= 3 };
  }

  return out;
}
