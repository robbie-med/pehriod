import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { IntakeRecord, MedicationId, Relief } from '../lib/types';
import { STORAGE_KEYS } from '../lib/storage';
import { useDoseTotals } from './useDoseTotals';
import { uid } from '../lib/period';

export function useMedicationData() {
  const [intakeHistory, setIntakeHistory] = useLocalStorage<IntakeRecord[]>(STORAGE_KEYS.INTAKE_HISTORY, []);
  const doseTotals = useDoseTotals(intakeHistory);

  const logIntake = useCallback((medicationId: MedicationId, timestamp: number, painLevel?: number) => {
    const rec: IntakeRecord = { id: uid(), medicationId, timestamp, painLevel };
    setIntakeHistory((prev) => [...prev, rec]);
    return rec.id;
  }, [setIntakeHistory]);

  const deleteIntake = useCallback((id: string) => {
    setIntakeHistory((prev) => prev.filter((i) => i.id !== id));
  }, [setIntakeHistory]);

  const setRelief = useCallback((id: string, relief: Relief | null | undefined) => {
    setIntakeHistory((prev) => prev.map((i) => (i.id === id ? { ...i, relief } : i)));
  }, [setIntakeHistory]);

  const setIntakeTime = useCallback((id: string, timestamp: number) => {
    setIntakeHistory((prev) => prev.map((i) => (i.id === id ? { ...i, timestamp } : i)));
  }, [setIntakeHistory]);

  return { intakeHistory, doseTotals, logIntake, deleteIntake, setRelief, setIntakeTime };
}
