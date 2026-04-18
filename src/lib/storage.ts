export const STORAGE_KEYS = {
  INTAKE_HISTORY: 'pehriod_intake_history',
  PAIN_LEVEL: 'pehriod_current_pain',
  LANGUAGE: 'pehriod_language',
  CYCLE_RECORDS: 'pehriod_cycles',
  DAY_LOGS: 'pehriod_day_logs',
  CALENDAR_EVENTS: 'pehriod_calendar_events',
  LAST_BACKUP_REMINDER: 'pehriod_last_backup_remind',
  BACKUP_REMINDER_DISABLED: 'pehriod_backup_remind_off',
} as const;

export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clearAllStorage(): void {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function exportAllData(): string {
  if (typeof window === 'undefined') return '{}';
  const data: Record<string, unknown> = {};
  Object.entries(STORAGE_KEYS).forEach(([label, key]) => {
    const raw = localStorage.getItem(key);
    if (raw) data[label] = JSON.parse(raw);
  });
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): { ok: boolean; error?: string } {
  if (typeof window === 'undefined') return { ok: false, error: 'Not in browser' };
  try {
    const data = JSON.parse(json) as Record<string, unknown>;
    const validKeys = new Set(Object.keys(STORAGE_KEYS));
    let imported = 0;
    for (const [label, value] of Object.entries(data)) {
      if (validKeys.has(label)) {
        const storageKey = STORAGE_KEYS[label as keyof typeof STORAGE_KEYS];
        localStorage.setItem(storageKey, JSON.stringify(value));
        imported++;
      }
    }
    if (imported === 0) return { ok: false, error: 'No valid data found in file' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Invalid JSON file' };
  }
}
