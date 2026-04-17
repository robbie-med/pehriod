import { CycleRecord, CycleStats } from './types';

export function isoToDate(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (isoToDate(b).getTime() - isoToDate(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(iso: string, n: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function sortedCycles(cycles: CycleRecord[]): CycleRecord[] {
  return [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getCycleStats(cycles: CycleRecord[]): CycleStats {
  const sorted = sortedCycles(cycles);
  const today = todayISO();

  const completed = sorted.filter((c) => c.endDate);
  const ongoingCycle = sorted.find((c) => !c.endDate);

  const periodLengths = completed.map((c) => daysBetween(c.startDate, c.endDate!) + 1);

  const cycleLengths: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const len = daysBetween(sorted[i].startDate, sorted[i + 1].startDate);
    if (len > 0 && len < 90) cycleLengths.push(len);
  }

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const avgCycle = avg(cycleLengths);
  const avgPeriod = avg(periodLengths);

  // Cycle length variation (standard deviation)
  let cycleVariation: number | null = null;
  if (cycleLengths.length >= 2 && avgCycle) {
    const variance = cycleLengths.reduce((sum, l) => sum + Math.pow(l - avgCycle, 2), 0) / cycleLengths.length;
    cycleVariation = Math.round(Math.sqrt(variance) * 10) / 10;
  }

  // Regularity classification
  let regularity: CycleStats['regularity'] = 'unknown';
  if (cycleVariation !== null) {
    if (cycleVariation <= 2) regularity = 'very_regular';
    else if (cycleVariation <= 4) regularity = 'regular';
    else if (cycleVariation <= 7) regularity = 'somewhat_irregular';
    else regularity = 'irregular';
  }

  // Next predicted start
  let nextPredicted: string | null = null;
  if (avgCycle && sorted.length > 0) {
    const lastStart = sorted[sorted.length - 1].startDate;
    nextPredicted = addDays(lastStart, avgCycle);
    if (nextPredicted <= today && ongoingCycle) {
      nextPredicted = addDays(ongoingCycle.startDate, avgCycle);
    }
  }

  // Fertile window: ovulation ≈ 14 days before next period (luteal phase = 14 days)
  // Fertile window = ovulation day ± 3 days (5-day window)
  let fertileWindowStart: string | null = null;
  let fertileWindowEnd: string | null = null;
  let ovulationDay: string | null = null;

  if (nextPredicted && avgCycle) {
    // Ovulation day = next predicted period - 14 days
    ovulationDay = addDays(nextPredicted, -14);
    fertileWindowStart = addDays(ovulationDay, -3);
    fertileWindowEnd = addDays(ovulationDay, 2);
  }

  // Is currently in fertile window?
  const isFertileNow =
    fertileWindowStart !== null &&
    fertileWindowEnd !== null &&
    today >= fertileWindowStart &&
    today <= fertileWindowEnd;

  // Current cycle day (days since last cycle start)
  let currentCycleDay: number | null = null;
  if (sorted.length > 0) {
    const lastStart = sorted[sorted.length - 1].startDate;
    if (lastStart <= today) {
      currentCycleDay = daysBetween(lastStart, today) + 1;
    }
  }

  const isOnPeriod = !!ongoingCycle && ongoingCycle.startDate <= today;
  let currentPeriodDay: number | null = null;
  if (isOnPeriod && ongoingCycle) {
    currentPeriodDay = daysBetween(ongoingCycle.startDate, today) + 1;
  }

  return {
    totalCycles: sorted.length,
    averageCycleLength: avgCycle,
    averagePeriodLength: avgPeriod,
    cycleVariation,
    regularity,
    nextPredictedStart: nextPredicted,
    fertileWindowStart,
    fertileWindowEnd,
    ovulationDay,
    isFertileNow,
    currentCycleDay,
    isOnPeriod,
    currentPeriodDay,
  };
}

export function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = isoToDate(start);
  const endDate = isoToDate(end);
  while (d <= endDate) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export function getPeriodDatesSet(cycles: CycleRecord[]): Set<string> {
  const set = new Set<string>();
  for (const cycle of cycles) {
    const end = cycle.endDate ?? todayISO();
    getDatesInRange(cycle.startDate, end).forEach((d) => set.add(d));
  }
  return set;
}

export function daysUntil(isoDate: string): number {
  return daysBetween(todayISO(), isoDate);
}
