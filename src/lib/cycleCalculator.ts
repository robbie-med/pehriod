import { CycleRecord, CycleStats, PredictedCycle } from './types';
import { addDays, daysBetween, datesInRange, todayISO } from './dates';

/** Luteal phase assumed 14 days; fertile window = 5 days before ovulation through 1 day after. */
const LUTEAL_DAYS = 14;

function fertileWindow(nextPeriodStart: string) {
  const ovulationDay = addDays(nextPeriodStart, -LUTEAL_DAYS);
  return {
    ovulationDay,
    fertileStart: addDays(ovulationDay, -5),
    fertileEnd: addDays(ovulationDay, 1),
  };
}

export function sortCycles(cycles: CycleRecord[]): CycleRecord[] {
  return [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getCycleStats(cycles: CycleRecord[], today: string = todayISO()): CycleStats {
  const sorted = sortCycles(cycles);

  const completed = sorted.filter((c) => c.endDate);
  const ongoingCycle = sorted.find((c) => !c.endDate);

  const periodLengths = completed.map((c) => daysBetween(c.startDate, c.endDate!) + 1);

  const cycleLengths: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const len = daysBetween(sorted[i].startDate, sorted[i + 1].startDate);
    if (len > 0 && len < 180) cycleLengths.push(len);
  }

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const avgCycle = avg(cycleLengths);
  const avgPeriod = avg(periodLengths);

  let cycleVariation: number | null = null;
  if (cycleLengths.length >= 2 && avgCycle) {
    const variance = cycleLengths.reduce((sum, l) => sum + Math.pow(l - avgCycle, 2), 0) / cycleLengths.length;
    cycleVariation = Math.round(Math.sqrt(variance) * 10) / 10;
  }

  let regularity: CycleStats['regularity'] = 'unknown';
  if (cycleVariation !== null) {
    if (cycleVariation <= 2) regularity = 'very_regular';
    else if (cycleVariation <= 4) regularity = 'regular';
    else if (cycleVariation <= 7) regularity = 'somewhat_irregular';
    else regularity = 'irregular';
  }

  let nextPredicted: string | null = null;
  if (avgCycle && sorted.length > 0) {
    const lastStart = sorted[sorted.length - 1].startDate;
    nextPredicted = addDays(lastStart, avgCycle);
    if (nextPredicted <= today && ongoingCycle) {
      nextPredicted = addDays(ongoingCycle.startDate, avgCycle);
    }
  }

  let fertileWindowStart: string | null = null;
  let fertileWindowEnd: string | null = null;
  let ovulationDay: string | null = null;
  if (nextPredicted) {
    const w = fertileWindow(nextPredicted);
    ovulationDay = w.ovulationDay;
    fertileWindowStart = w.fertileStart;
    fertileWindowEnd = w.fertileEnd;
  }

  const isFertileNow =
    fertileWindowStart !== null &&
    fertileWindowEnd !== null &&
    today >= fertileWindowStart &&
    today <= fertileWindowEnd;

  const upcomingCycles: PredictedCycle[] = [];
  if (nextPredicted && avgCycle) {
    const oneYearOut = addDays(today, 365);
    for (let cursor = nextPredicted; cursor <= oneYearOut; cursor = addDays(cursor, avgCycle)) {
      upcomingCycles.push({ periodStart: cursor, ...fertileWindow(cursor) });
    }
  }

  let currentCycleDay: number | null = null;
  if (sorted.length > 0) {
    const lastStart = sorted[sorted.length - 1].startDate;
    if (lastStart <= today) currentCycleDay = daysBetween(lastStart, today) + 1;
  }

  const isOnPeriod = !!ongoingCycle && ongoingCycle.startDate <= today;
  const currentPeriodDay = isOnPeriod && ongoingCycle ? daysBetween(ongoingCycle.startDate, today) + 1 : null;

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
    upcomingCycles,
  };
}

export function getPeriodDatesSet(cycles: CycleRecord[], today: string = todayISO()): Set<string> {
  const set = new Set<string>();
  for (const cycle of cycles) {
    datesInRange(cycle.startDate, cycle.endDate ?? today).forEach((d) => set.add(d));
  }
  return set;
}
