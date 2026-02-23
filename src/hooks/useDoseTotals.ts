import { useMemo } from 'react';
import { IntakeRecord, DoseTotals } from '../lib/types';
import { MEDICATIONS } from '../lib/medications';
import { calculateDoseTotals } from '../lib/doseCalculator';

/**
 * Calculate current 24-hour dose totals
 * Memoized to prevent unnecessary recalculations
 */
export function useDoseTotals(intakeHistory: IntakeRecord[]): DoseTotals {
  return useMemo(
    () => calculateDoseTotals(intakeHistory, MEDICATIONS),
    [intakeHistory]
  );
}
