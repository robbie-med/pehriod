import { useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { IntakeRecord, MedicationId, DoseTotals } from '../lib/types';
import { STORAGE_KEYS } from '../lib/storage';
import { useDoseTotals } from './useDoseTotals';

/**
 * Central state management hook
 * Syncs with LocalStorage and provides all medication data operations
 */
export function useMedicationData() {
  const [intakeHistory, setIntakeHistory] = useLocalStorage<IntakeRecord[]>(
    STORAGE_KEYS.INTAKE_HISTORY,
    []
  );

  const [painLevel, setPainLevel] = useLocalStorage<number>(
    STORAGE_KEYS.PAIN_LEVEL,
    0
  );

  // Derived state: current 24hr dose totals
  const doseTotals: DoseTotals = useDoseTotals(intakeHistory);

  // Add new intake
  const logIntake = useCallback(
    (
      medicationId: MedicationId,
      scheduledTime?: string,
      customPainLevel?: number,
      customTimestamp?: number
    ) => {
      const newIntake: IntakeRecord = {
        id: crypto.randomUUID(),
        medicationId,
        timestamp: customTimestamp || Date.now(),
        scheduledTime,
        painLevel: customPainLevel ?? painLevel,
      };

      setIntakeHistory((prev) => [...prev, newIntake]);
    },
    [painLevel, setIntakeHistory]
  );

  // Delete intake (for corrections)
  const deleteIntake = useCallback(
    (id: string) => {
      setIntakeHistory((prev) => prev.filter((i) => i.id !== id));
    },
    [setIntakeHistory]
  );

  // Clear all history
  const clearHistory = useCallback(() => {
    setIntakeHistory([]);
  }, [setIntakeHistory]);

  // Auto-cleanup old history (>7 days)
  useEffect(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    setIntakeHistory((prev) => prev.filter((i) => i.timestamp > sevenDaysAgo));
  }, [setIntakeHistory]);

  return {
    intakeHistory,
    painLevel,
    setPainLevel,
    doseTotals,
    logIntake,
    deleteIntake,
    clearHistory,
  };
}
