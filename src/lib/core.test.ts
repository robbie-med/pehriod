import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, datesInRange, isoOfTs, toISODate } from './dates';
import { getCycleStats } from './cycleCalculator';
import { checkSafety } from './safetyChecker';
import { calculateDoseTotals } from './doseCalculator';
import { MEDICATIONS } from './medications';
import { DOSE_LIMITS } from './doseLimits';
import { dayFlow, entryPoints, isHeavy, summarize } from './pbac';
import { applyBleed, suggestedEnd } from './period';
import { nsaidNonResponse, pendingRelief } from './relief';
import { buildReport } from './report';
import { BleedEntry, CycleRecord, IntakeRecord } from './types';

const at = (iso: string, hour = 12) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, hour).getTime();
};
const bleed = (iso: string, e: Partial<BleedEntry>): BleedEntry => ({ id: Math.random().toString(), ts: at(iso), kind: 'pad', ...e });

describe(`dates (TZ=${process.env.TZ})`, () => {
  it('adds days in local time', () => {
    expect(addDays('2026-01-15', 1)).toBe('2026-01-16');
    expect(addDays('2026-01-15', 28)).toBe('2026-02-12');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });
  it('survives DST changes', () => {
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09');
    expect(addDays('2026-10-31', 2)).toBe('2026-11-02');
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31);
  });
  it('local date of a timestamp is the wall-clock date', () => {
    expect(isoOfTs(new Date(2026, 0, 15, 0, 30).getTime())).toBe('2026-01-15');
    expect(isoOfTs(new Date(2026, 0, 15, 23, 30).getTime())).toBe('2026-01-15');
    expect(toISODate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
  it('ranges are inclusive and terminate', () => {
    expect(datesInRange('2026-01-30', '2026-02-02')).toEqual(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02']);
  });
});

describe('cycle stats', () => {
  const cycles: CycleRecord[] = [
    { id: 'a', startDate: '2026-01-01', endDate: '2026-01-05', flowByDay: {} },
    { id: 'b', startDate: '2026-01-29', endDate: '2026-02-02', flowByDay: {} },
    { id: 'c', startDate: '2026-02-26', endDate: '2026-03-02', flowByDay: {} },
  ];
  it('predicts from the average length', () => {
    const s = getCycleStats(cycles, '2026-03-10');
    expect(s.averageCycleLength).toBe(28);
    expect(s.averagePeriodLength).toBe(5);
    expect(s.nextPredictedStart).toBe('2026-03-26');
    expect(s.ovulationDay).toBe('2026-03-12');
    expect(s.fertileWindowStart).toBe('2026-03-07');
    expect(s.fertileWindowEnd).toBe('2026-03-13');
    expect(s.isFertileNow).toBe(true);
    expect(s.upcomingCycles[0].fertileStart).toBe(s.fertileWindowStart);
  });
});

describe('dose safety', () => {
  const dose = (id: IntakeRecord['medicationId'], hoursAgo: number): IntakeRecord => ({
    id: Math.random().toString(), medicationId: id, timestamp: Date.now() - hoursAgo * 3600e3,
  });
  const check = (history: IntakeRecord[], med: IntakeRecord['medicationId']) =>
    checkSafety(med, calculateDoseTotals(history, MEDICATIONS), history, MEDICATIONS, DOSE_LIMITS);

  it('allows the third 400 mg ibuprofen (1200 mg total)', () => {
    const v = check([dose('ibuprofen', 10), dose('ibuprofen', 5)], 'ibuprofen');
    expect(v.filter((x) => x.severity === 'error')).toEqual([]);
  });
  it('blocks the fourth', () => {
    const v = check([dose('ibuprofen', 15), dose('ibuprofen', 10), dose('ibuprofen', 5)], 'ibuprofen');
    expect(v.some((x) => x.type === 'daily-limit-exceeded')).toBe(true);
  });
  it('allows naproxen up to 660 mg', () => {
    const v = check([dose('naproxen', 20), dose('naproxen', 10)], 'naproxen');
    expect(v.filter((x) => x.severity === 'error')).toEqual([]);
  });
  it('sums acetaminophen across combination products', () => {
    const h = [1, 5, 9, 13, 17].map((hrs) => dose('pamprin-multi', hrs));
    expect(check(h, 'acetaminophen').filter((x) => x.severity === 'error')).toEqual([]);
    expect(check([...h, dose('acetaminophen', 0.1 + 20)], 'midol-complete').some((x) => x.type === 'daily-limit-exceeded')).toBe(true);
  });
  it('blocks too-soon repeats and Midol with Pamprin Max', () => {
    expect(check([dose('ibuprofen', 1)], 'ibuprofen').some((x) => x.type === 'too-soon-since-last-dose')).toBe(true);
    expect(check([dose('pamprin-max-energy', 6)], 'midol-complete').some((x) => x.type === 'conflicting-medications')).toBe(true);
  });
});

describe('PBAC', () => {
  it('uses Higham points', () => {
    expect(entryPoints(bleed('2026-01-01', { kind: 'pad', fill: 3 }))).toBe(20);
    expect(entryPoints(bleed('2026-01-01', { kind: 'tampon', fill: 3 }))).toBe(10);
    expect(entryPoints(bleed('2026-01-01', { kind: 'tampon', fill: 2 }))).toBe(5);
    expect(entryPoints(bleed('2026-01-01', { kind: 'clot', big: true }))).toBe(5);
    expect(entryPoints(bleed('2026-01-01', { kind: 'liner' }))).toBe(0);
  });
  it('flags a cycle at 100 points or 80 mL', () => {
    const five = Array.from({ length: 5 }, () => bleed('2026-01-01', { kind: 'pad', fill: 3 }));
    expect(isHeavy(summarize(five))).toBe(true);
    expect(isHeavy(summarize(five.slice(1)))).toBe(false);
    expect(isHeavy(summarize([bleed('2026-01-01', { kind: 'cup', ml: 80 })]))).toBe(true);
  });
  it('derives a day level', () => {
    expect(dayFlow([bleed('2026-01-01', { kind: 'liner' })])).toBe('spotting');
    expect(dayFlow([bleed('2026-01-01', { kind: 'pad', fill: 1 })])).toBe('light');
    expect(dayFlow([bleed('2026-01-01', { kind: 'pad', fill: 3 }), bleed('2026-01-01', { kind: 'pad', fill: 3 })])).toBe('heavy');
  });
});

describe('period auto-start', () => {
  const today = '2026-02-10';
  it('starts an ongoing period on a bleed today', () => {
    const next = applyBleed([], bleed(today, { fill: 2 }), today);
    expect(next).toHaveLength(1);
    expect(next[0].startDate).toBe(today);
    expect(next[0].endDate).toBeUndefined();
  });
  it('ignores liners', () => {
    expect(applyBleed([], bleed(today, { kind: 'liner' }), today)).toEqual([]);
  });
  it('reopens a period that ended within 2 days', () => {
    const c: CycleRecord[] = [{ id: 'x', startDate: '2026-02-04', endDate: '2026-02-08', flowByDay: {} }];
    const next = applyBleed(c, bleed(today, { fill: 1 }), today);
    expect(next).toHaveLength(1);
    expect(next[0].endDate).toBeUndefined();
  });
  it('suggests ending after two dry days', () => {
    const c: CycleRecord[] = [{ id: 'x', startDate: '2026-02-04', flowByDay: {} }];
    const e = [bleed('2026-02-07', { fill: 1 })];
    expect(suggestedEnd(c, e, '2026-02-08')).toBeNull();
    expect(suggestedEnd(c, e, '2026-02-09')).toBe('2026-02-07');
  });
});

describe('relief', () => {
  it('asks between 1 and 12 hours after a dose', () => {
    const now = Date.now();
    const i = (h: number, relief?: IntakeRecord['relief']): IntakeRecord => ({ id: String(h), medicationId: 'ibuprofen', timestamp: now - h * 3600e3, relief });
    expect(pendingRelief([i(0.5), i(2), i(13), i(3, 2)], now).map((x) => x.id)).toEqual(['2']);
  });
  it('flags NSAID non-response across cycles', () => {
    const cycles: CycleRecord[] = [
      { id: 'a', startDate: '2026-01-01', endDate: '2026-01-05', flowByDay: {} },
      { id: 'b', startDate: '2026-01-29', endDate: '2026-02-02', flowByDay: {} },
    ];
    const r = (iso: string, relief: 0 | 1 | 3): IntakeRecord => ({ id: iso + relief, medicationId: 'ibuprofen', timestamp: at(iso), relief });
    const poor = [r('2026-01-01', 0), r('2026-01-02', 1), r('2026-01-29', 0), r('2026-01-30', 1)];
    expect(nsaidNonResponse(poor, cycles).flagged).toBe(true);
    expect(nsaidNonResponse([...poor, r('2026-01-31', 3), r('2026-01-31', 3)], cycles).flagged).toBe(false);
  });
});

describe('report', () => {
  it('summarises cycles against FIGO limits', () => {
    const cycles: CycleRecord[] = [
      { id: 'a', startDate: '2026-01-01', endDate: '2026-01-10', flowByDay: {} },
      { id: 'b', startDate: '2026-01-21', endDate: '2026-01-25', flowByDay: {} },
      { id: 'c', startDate: '2026-02-25', endDate: '2026-03-01', flowByDay: {} },
    ];
    const bleeds = Array.from({ length: 6 }, () => bleed('2026-01-22', { kind: 'pad', fill: 3 }));
    const r = buildReport(cycles, bleeds, [], [], '2026-03-05');
    expect(r.cycles.map((c) => c.start)).toEqual(['2026-02-25', '2026-01-21', '2026-01-01']);
    expect(r.cycles[1].score).toBe(120);
    expect(r.heavy).toBe(1);
    expect(r.variation).toBe(15);
    expect(r.regularity).toBe('irregular');
    expect(r.prolonged).toBe(1);
    expect(r.flags).toEqual(expect.arrayContaining(['heavy', 'irregular', 'prolonged']));
  });
});
