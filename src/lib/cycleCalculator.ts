import { CycleRecord, CycleStats } from './types';

function isoToDate(iso: string): Date {
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

function sortedCycles(cycles: CycleRecord[]): CycleRecord[] {
  return [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getCycleStats(cycles: CycleRecord[]): CycleStats {
  const sorted = sortedCycles(cycles);
  const today = todayISO();

  const completed = sorted.filter((c) => c.endDate);
  const ongoingCycle = sorted.find((c) => !c.endDate);

  // Period lengths (days from start to end inclusive)
  const periodLengths = completed.map((c) => daysBetween(c.startDate, c.endDate!) + 1);

  // Cycle lengths (start to start of next)
  const cycleLengths: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const len = daysBetween(sorted[i].startDate, sorted[i + 1].startDate);
    if (len > 0 && len < 90) cycleLengths.push(len);
  }

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const avgCycle = avg(cycleLengths);
  const avgPeriod = avg(periodLengths);

  // Predict next start from the most recent cycle start
  let nextPredicted: string | null = null;
  if (avgCycle && sorted.length > 0) {
    const lastStart = sorted[sorted.length - 1].startDate;
    const d = isoToDate(lastStart);
    d.setDate(d.getDate() + avgCycle);
    nextPredicted = d.toISOString().split('T')[0];
    // If prediction is in the past and there's an ongoing cycle, predict from now
    if (nextPredicted <= today && ongoingCycle) {
      const d2 = isoToDate(ongoingCycle.startDate);
      d2.setDate(d2.getDate() + avgCycle);
      nextPredicted = d2.toISOString().split('T')[0];
    }
  }

  // Current cycle day (days since last cycle start)
  let currentCycleDay: number | null = null;
  if (sorted.length > 0) {
    const lastStart = sorted[sorted.length - 1].startDate;
    if (lastStart <= today) {
      currentCycleDay = daysBetween(lastStart, today) + 1;
    }
  }

  // On period?
  const isOnPeriod = !!ongoingCycle && ongoingCycle.startDate <= today;
  let currentPeriodDay: number | null = null;
  if (isOnPeriod && ongoingCycle) {
    currentPeriodDay = daysBetween(ongoingCycle.startDate, today) + 1;
  }

  return {
    totalCycles: sorted.length,
    averageCycleLength: avgCycle,
    averagePeriodLength: avgPeriod,
    nextPredictedStart: nextPredicted,
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
