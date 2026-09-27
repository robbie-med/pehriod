import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { DEFAULT_PREFS, Prefs, STORAGE_KEYS } from '../lib/storage';

export function usePrefs() {
  const [stored, setStored] = useLocalStorage<Partial<Prefs>>(STORAGE_KEYS.PREFS, {});
  const prefs: Prefs = { ...DEFAULT_PREFS, ...stored, size: { ...DEFAULT_PREFS.size, ...stored.size } };

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setStored((prev) => ({ ...prev, ...patch }));
  }, [setStored]);

  return [prefs, setPrefs] as const;
}
