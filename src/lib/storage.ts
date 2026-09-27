import { CalendarEvent, DayLog, Product, TrackerValue } from './types';
import type { TrackerId, Units } from './trackers';
import type { Language } from '../data/translations';
import { uid } from './period';

export const STORAGE_KEYS = {
  INTAKE_HISTORY: 'pehriod_intake_history',
  LANGUAGE: 'pehriod_language',
  CYCLE_RECORDS: 'pehriod_cycles',
  DAY_LOGS: 'pehriod_day_logs',
  BLEEDS: 'pehriod_bleeds',
  PREFS: 'pehriod_prefs',
  VISIT: 'pehriod_visit',
  LAST_BACKUP_REMINDER: 'pehriod_last_backup_remind',
  BACKUP_REMINDER_DISABLED: 'pehriod_backup_remind_off',
} as const;

const PREFIX = 'pehriod_';
const SCHEMA_KEY = 'pehriod_schema';
const SCHEMA = 2;

const LEGACY = {
  CALENDAR_EVENTS: 'pehriod_calendar_events',
  PAIN_LEVEL: 'pehriod_current_pain',
};

export interface Prefs {
  trackers: TrackerId[];
  units: Units;
  doctorLang: Language;
  product: Product;
  size: Record<'pad' | 'tampon' | 'cup', number>;
}

export const DEFAULT_PREFS: Prefs = {
  trackers: [],
  units: 'metric',
  doctorLang: 'en',
  product: 'pad',
  size: { pad: 2, tampon: 2, cup: 3 },
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** Schema 1 → 2: calendar events become day-log tracker values; the global pain value is dropped. */
export function migrate(): void {
  if (typeof window === 'undefined') return;
  if (read<number>(SCHEMA_KEY, 1) >= SCHEMA) return;

  const events = read<CalendarEvent[]>(LEGACY.CALENDAR_EVENTS, []);
  if (events.length) {
    const logs = read<DayLog[]>(STORAGE_KEYS.DAY_LOGS, []);
    const prefs = { ...DEFAULT_PREFS, ...read<Partial<Prefs>>(STORAGE_KEYS.PREFS, {}) };
    const enabled = new Set(prefs.trackers);
    for (const ev of events) {
      let log = logs.find((l) => l.date === ev.date);
      if (!log) {
        log = { id: uid(), date: ev.date, symptoms: [] };
        logs.push(log);
      }
      const values: Record<string, TrackerValue> = { ...log.values };
      const notes: string[] = log.notes ? [log.notes] : [];
      if (ev.type === 'stress') { values.stress = 4; enabled.add('stress'); }
      else if (ev.type === 'travel' || ev.type === 'timezone') { values.travel = true; enabled.add('travel'); }
      else if (ev.type === 'illness') { values.sick = true; enabled.add('sick'); }
      else notes.push(ev.type);
      if (ev.notes) notes.push(ev.notes);
      log.values = values;
      log.notes = notes.join(' · ') || undefined;
    }
    write(STORAGE_KEYS.DAY_LOGS, logs);
    write(STORAGE_KEYS.PREFS, { ...prefs, trackers: Array.from(enabled) });
  }
  localStorage.removeItem(LEGACY.CALENDAR_EVENTS);
  localStorage.removeItem(LEGACY.PAIN_LEVEL);
  write(SCHEMA_KEY, SCHEMA);
}

function appKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k);
  }
  return keys;
}

export function clearAllStorage(): void {
  if (typeof window === 'undefined') return;
  appKeys().forEach((k) => localStorage.removeItem(k));
}

export function exportAllData(): string {
  if (typeof window === 'undefined') return '{}';
  const data: Record<string, unknown> = {};
  Object.entries(STORAGE_KEYS).forEach(([label, key]) => {
    const raw = localStorage.getItem(key);
    if (raw) {
      try { data[label] = JSON.parse(raw); } catch { data[label] = raw; }
    }
  });
  data.SCHEMA = SCHEMA;
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): { ok: boolean; error?: string } {
  if (typeof window === 'undefined') return { ok: false, error: 'Not in browser' };
  try {
    const data = JSON.parse(json) as Record<string, unknown>;
    const legacy: Record<string, string> = { CALENDAR_EVENTS: LEGACY.CALENDAR_EVENTS };
    let imported = 0;
    for (const [label, value] of Object.entries(data)) {
      const key = STORAGE_KEYS[label as keyof typeof STORAGE_KEYS] ?? legacy[label];
      if (key) {
        localStorage.setItem(key, JSON.stringify(value));
        imported++;
      }
    }
    if (imported === 0) return { ok: false, error: 'No valid data found in file' };
    write(SCHEMA_KEY, typeof data.SCHEMA === 'number' ? data.SCHEMA : 1);
    migrate();
    return { ok: true };
  } catch {
    return { ok: false, error: 'Invalid JSON file' };
  }
}
