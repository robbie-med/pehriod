import {
  MedicationId,
  DoseTotals,
  IntakeRecord,
  Medication,
  DoseLimit,
  SafetyViolation,
} from './types';

export function checkSafety(
  proposedMedId: MedicationId,
  currentTotals: DoseTotals,
  intakeHistory: IntakeRecord[],
  medications: Medication[],
  doseLimits: DoseLimit[]
): SafetyViolation[] {
  const violations: SafetyViolation[] = [];
  const proposedMed = medications.find((m) => m.id === proposedMedId);
  if (!proposedMed) return violations;

  // 1. Daily limits
  for (const ingredient of proposedMed.composition) {
    const limit = doseLimits.find((l) => l.ingredient === ingredient.ingredient);
    if (!limit) continue;
    const newTotal = (currentTotals[ingredient.ingredient] ?? 0) + ingredient.amountMg;

    if (newTotal > limit.maxDailyMg && limit.isHardLimit) {
      violations.push({
        type: 'daily-limit-exceeded',
        severity: 'error',
        messageKey: 'error_daily_limit',
        details: {
          ingredient: ingredient.ingredient,
          currentMg: currentTotals[ingredient.ingredient],
          limitMg: limit.maxDailyMg,
        },
      });
    } else if (limit.warningThresholdMg && newTotal > limit.warningThresholdMg) {
      violations.push({
        type: 'approaching-limit',
        severity: 'warning',
        messageKey: 'warning_approaching_limit',
        details: {
          ingredient: ingredient.ingredient,
          currentMg: newTotal,
          limitMg: limit.maxDailyMg,
        },
      });
    }
  }

  // 2. Conflicts (Pamprin Max vs Midol)
  const last24hrs = intakeHistory.filter(
    (i) => i.timestamp > Date.now() - 24 * 60 * 60 * 1000
  );

  if (proposedMed.conflictsWith) {
    const hasConflict = last24hrs.some((intake) =>
      proposedMed.conflictsWith!.includes(intake.medicationId)
    );
    if (hasConflict) {
      violations.push({
        type: 'conflicting-medications',
        severity: 'error',
        messageKey: 'error_conflicting_meds',
        details: { conflictingMed: proposedMed.conflictsWith[0] },
      });
    }
  }

  // 3. Minimum interval between same medication
  const lastSameMed = last24hrs
    .filter((i) => i.medicationId === proposedMedId)
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  if (lastSameMed) {
    const hoursSince = (Date.now() - lastSameMed.timestamp) / (60 * 60 * 1000);
    const minHours = proposedMed.minIntervalHours;
    if (hoursSince < minHours) {
      const minutesUntilSafe = Math.ceil((minHours - hoursSince) * 60);
      violations.push({
        type: 'too-soon-since-last-dose',
        severity: 'error',
        messageKey: 'error_too_soon',
        details: { minutesUntilSafe },
      });
    }
  }

  return violations;
}
