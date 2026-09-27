// Optional daily trackers. Values live in DayLog.values keyed by tracker id,
// always stored in metric units (kg, °C) and converted for display.

export type TrackerId =
  | 'weight'
  | 'exercise'
  | 'rhr'
  | 'stress'
  | 'travel'
  | 'sick'
  | 'bbt'
  | 'mucus'
  | 'lh';

export type Units = 'metric' | 'imperial';

interface NumberTracker {
  kind: 'number';
  step: number;
  decimals: number;
  min: number;
  max: number;
  /** Starting value before anything is logged, in stored units. */
  start: number;
  unit: (u: Units) => string;
  toDisplay?: (v: number, u: Units) => number;
  fromDisplay?: (v: number, u: Units) => number;
  /** Display step for imperial, when it differs. */
  stepImperial?: number;
}

interface ScaleTracker { kind: 'scale'; max: number }
interface ChoiceTracker { kind: 'choice'; options: readonly string[] }
interface ToggleTracker { kind: 'toggle' }

export type TrackerDef = { id: TrackerId } & (NumberTracker | ScaleTracker | ChoiceTracker | ToggleTracker);

const LB_PER_KG = 2.20462;

export const TRACKERS: TrackerDef[] = [
  {
    id: 'weight', kind: 'number', step: 0.1, decimals: 1, min: 20, max: 300, start: 60,
    unit: (u) => (u === 'imperial' ? 'lb' : 'kg'),
    toDisplay: (v, u) => (u === 'imperial' ? v * LB_PER_KG : v),
    fromDisplay: (v, u) => (u === 'imperial' ? v / LB_PER_KG : v),
  },
  { id: 'exercise', kind: 'number', step: 5, decimals: 0, min: 0, max: 600, start: 30, unit: () => 'min' },
  { id: 'rhr', kind: 'number', step: 1, decimals: 0, min: 30, max: 150, start: 65, unit: () => 'bpm' },
  { id: 'stress', kind: 'scale', max: 5 },
  { id: 'travel', kind: 'toggle' },
  { id: 'sick', kind: 'toggle' },
  {
    id: 'bbt', kind: 'number', step: 0.05, stepImperial: 0.1, decimals: 2, min: 34, max: 40, start: 36.5,
    unit: (u) => (u === 'imperial' ? '°F' : '°C'),
    toDisplay: (v, u) => (u === 'imperial' ? v * 1.8 + 32 : v),
    fromDisplay: (v, u) => (u === 'imperial' ? (v - 32) / 1.8 : v),
  },
  { id: 'mucus', kind: 'choice', options: ['dry', 'sticky', 'creamy', 'watery', 'eggwhite'] },
  { id: 'lh', kind: 'choice', options: ['neg', 'pos'] },
];

export const TRACKER_IDS = TRACKERS.map((t) => t.id);

export function trackerDef(id: TrackerId): TrackerDef {
  return TRACKERS.find((t) => t.id === id)!;
}

export function displayNumber(def: TrackerDef, stored: number, units: Units): number {
  if (def.kind !== 'number') return stored;
  return def.toDisplay ? def.toDisplay(stored, units) : stored;
}

export function storeNumber(def: TrackerDef, shown: number, units: Units): number {
  if (def.kind !== 'number') return shown;
  return def.fromDisplay ? def.fromDisplay(shown, units) : shown;
}

export function displayStep(def: TrackerDef, units: Units): number {
  if (def.kind !== 'number') return 1;
  return units === 'imperial' && def.stepImperial ? def.stepImperial : def.step;
}

/** Numeric trackers worth charting over time. */
export const CHARTABLE: TrackerId[] = ['weight', 'exercise', 'rhr', 'bbt', 'stress'];
