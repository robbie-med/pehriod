import { useMemo } from 'react';
import { IntakeRecord, DoseTotals, Recommendation } from '../lib/types';
import { MEDICATIONS } from '../lib/medications';
import { DOSE_LIMITS } from '../lib/doseLimits';
import { FIXED_SCHEDULE } from '../lib/schedule';
import { getNextRecommendation } from '../lib/recommendationEngine';

/**
 * Get real-time recommendation for next medication to take
 * Recalculates when intake history or dose totals change
 */
export function useRecommendation(
  intakeHistory: IntakeRecord[],
  doseTotals: DoseTotals
): Recommendation | null {
  return useMemo(
    () =>
      getNextRecommendation(
        FIXED_SCHEDULE,
        intakeHistory,
        doseTotals,
        MEDICATIONS,
        DOSE_LIMITS
      ),
    [intakeHistory, doseTotals]
  );
}
