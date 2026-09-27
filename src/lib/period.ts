import { BleedEntry, CycleRecord } from './types';
import { daysBetween, isoOfTs } from './dates';
import { isBleeding } from './pbac';

/** A bleed within this many days after a period's end extends that period instead of starting a new one. */
const REJOIN_DAYS = 2;

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function periodOn(cycles: CycleRecord[], date: string, today: string): CycleRecord | undefined {
  return cycles.find((c) => c.startDate <= date && date <= (c.endDate ?? today));
}

/**
 * Returns cycles updated for a bleed on `date`: unchanged when the date is already inside a period,
 * the nearest just-ended period extended (reopened if the bleed is today), or a new period started.
 */
export function applyBleed(cycles: CycleRecord[], entry: BleedEntry, today: string): CycleRecord[] {
  if (!isBleeding(entry)) return cycles;
  const date = isoOfTs(entry.ts);
  if (periodOn(cycles, date, today)) return cycles;

  const ongoing = cycles.find((c) => !c.endDate);
  const recent = cycles.find(
    (c) => c.endDate && c.endDate < date && daysBetween(c.endDate, date) <= REJOIN_DAYS
  );
  if (recent && !ongoing) {
    return cycles.map((c) =>
      c.id === recent.id ? { ...c, endDate: date === today ? undefined : date } : c
    );
  }
  if (ongoing) return cycles;

  return [
    ...cycles,
    { id: uid(), startDate: date, endDate: date === today ? undefined : date, flowByDay: {} },
  ];
}

/** Last date with any logged bleeding or manual flow inside the cycle, if any. */
export function lastBleedDate(cycle: CycleRecord, entries: BleedEntry[], today: string): string | null {
  const end = cycle.endDate ?? today;
  let last: string | null = null;
  for (const e of entries) {
    const d = isoOfTs(e.ts);
    if (d >= cycle.startDate && d <= end && (!last || d > last)) last = d;
  }
  for (const d of Object.keys(cycle.flowByDay)) {
    if (d >= cycle.startDate && d <= end && (!last || d > last)) last = d;
  }
  return last;
}

/** When the ongoing period has had no bleeding logged for 2+ days, suggest ending it on the last bleed date. */
export function suggestedEnd(cycles: CycleRecord[], entries: BleedEntry[], today: string): string | null {
  const ongoing = cycles.find((c) => !c.endDate);
  if (!ongoing) return null;
  const last = lastBleedDate(ongoing, entries, today);
  if (!last) return null;
  return daysBetween(last, today) >= 2 ? last : null;
}

export function defaultEndDate(cycle: CycleRecord, entries: BleedEntry[], today: string): string {
  return lastBleedDate(cycle, entries, today) ?? today;
}

/** Start date of the cycle a date belongs to (latest start on or before it). */
export function cycleStartFor(sortedStarts: string[], date: string): string | null {
  let found: string | null = null;
  for (const s of sortedStarts) {
    if (s <= date) found = s;
    else break;
  }
  return found;
}
