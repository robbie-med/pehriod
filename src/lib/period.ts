import { BleedEntry, CycleRecord, FlowLevel } from './types';
import { addDays, daysBetween, isoOfTs } from './dates';
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

/**
 * Marks or clears one past-or-present day as a period day with a flow level, for filling in
 * periods after the fact. Marking joins the day to a period within REJOIN_DAYS on either side
 * (merging two periods it bridges) or starts a one-day period. Clearing the first or last day
 * shrinks the period; clearing its only day removes it. Days in the future are ignored.
 */
export function markDay(
  cycles: CycleRecord[],
  date: string,
  flow: FlowLevel | null,
  today: string
): CycleRecord[] {
  if (date > today) return cycles;
  const inside = periodOn(cycles, date, today);

  if (flow === null) {
    if (!inside) return cycles;
    const flowByDay = { ...inside.flowByDay };
    delete flowByDay[date];
    const end = inside.endDate ?? today;
    if (inside.startDate === date && end === date) return cycles.filter((c) => c.id !== inside.id);
    let next: CycleRecord = { ...inside, flowByDay };
    if (date === inside.startDate) next = { ...next, startDate: addDays(date, 1) };
    else if (inside.endDate && date === inside.endDate) next = { ...next, endDate: addDays(date, -1) };
    return cycles.map((c) => (c.id === inside.id ? next : c));
  }

  if (inside) {
    return cycles.map((c) => (c.id === inside.id ? { ...c, flowByDay: { ...c.flowByDay, [date]: flow } } : c));
  }

  const before = cycles.find(
    (c) => c.endDate && c.endDate < date && daysBetween(c.endDate, date) <= REJOIN_DAYS
  );
  const after = cycles.find(
    (c) => c.startDate > date && daysBetween(date, c.startDate) <= REJOIN_DAYS
  );

  if (before && after) {
    const merged: CycleRecord = {
      ...before,
      endDate: after.endDate,
      flowByDay: { ...before.flowByDay, ...after.flowByDay, [date]: flow },
    };
    return cycles.filter((c) => c.id !== after.id).map((c) => (c.id === before.id ? merged : c));
  }
  if (before) {
    return cycles.map((c) =>
      c.id === before.id ? { ...c, endDate: date, flowByDay: { ...c.flowByDay, [date]: flow } } : c
    );
  }
  if (after) {
    return cycles.map((c) =>
      c.id === after.id ? { ...c, startDate: date, flowByDay: { ...c.flowByDay, [date]: flow } } : c
    );
  }
  const ongoing = cycles.some((c) => !c.endDate);
  return [
    ...cycles,
    {
      id: uid(),
      startDate: date,
      endDate: date === today && !ongoing ? undefined : date,
      flowByDay: { [date]: flow },
    },
  ];
}
