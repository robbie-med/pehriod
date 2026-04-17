import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { IntakeRecord, MedicationId } from '../lib/types';
import { STORAGE_KEYS } from '../lib/storage';
import { useDoseTotals } from './useDoseTotals';

export function useMedicationData() {
  const [intakeHistory, setIntakeHistory] = useLocalStorage<IntakeRecord[]>(
    STORAGE_KEYS.INTAKE_HISTORY,
    []
  );

  const [painLevel, setPainLevel] = useLocalStorage<number>(
    STORAGE_KEYS.PAIN_LEVEL,
    0
  );

  const doseTotals = useDoseTotals(intakeHistory);

  const logIntake = useCallback(
    (medicationId: MedicationId, customPainLevel?: number) => {
      const newIntake: IntakeRecord = {
        id: crypto.randomUUID(),
        medicationId,
        timestamp: Date.now(),
        painLevel: customPainLevel ?? painLevel,
      };
      setIntakeHistory((prev) => [...prev, newIntake]);
    },
    [painLevel, setIntakeHistory]
  );

  const deleteIntake = useCallback(
    (id: string) => {
      setIntakeHistory((prev) => prev.filter((i) => i.id !== id));
    },
    [setIntakeHistory]
  );

  const clearHistory = useCallback(() => {
    setIntakeHistory([]);
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
