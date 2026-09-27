import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { BleedEntry } from '../lib/types';
import { STORAGE_KEYS } from '../lib/storage';

export function useBleeds() {
  const [bleeds, setBleeds] = useLocalStorage<BleedEntry[]>(STORAGE_KEYS.BLEEDS, []);

  const addBleed = useCallback((e: BleedEntry) => setBleeds((prev) => [...prev, e]), [setBleeds]);
  const removeBleed = useCallback((id: string) => setBleeds((prev) => prev.filter((b) => b.id !== id)), [setBleeds]);

  return { bleeds, addBleed, removeBleed };
}
