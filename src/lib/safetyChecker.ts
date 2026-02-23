import {
  MedicationId,
  DoseTotals,
  IntakeRecord,
  Medication,
  DoseLimit,
  SafetyViolation,
} from './types';

/**
 * Validate if a proposed medication intake is safe
 *
 * Checks:
 * 1. Would exceed daily limits for any ingredient?
 * 2. Conflicts with medication taken in last 24hrs?
 * 3. Too soon since last dose of same medication? (min 4hr gap)
 *
 * Returns array of violations (empty = safe)
 */
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

  // 1. Check daily limits
  for (const ingredient of proposedMed.composition) {
    const limit = doseLimits.find((l) => l.ingredient === ingredient.ingredient);
    if (!limit) continue;

    const newTotal = currentTotals[ingredient.ingredient] + ingredient.amountMg;

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

  // 2. Check conflicts (Pamprin Max vs Midol)
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
        details: {
          conflictingMed: proposedMed.conflictsWith[0],
        },
      });
    }
  }

  // 3. Check minimum time between same medication (4 hours)
  const lastSameMed = last24hrs
    .filter((i) => i.medicationId === proposedMedId)
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  if (lastSameMed) {
    const hoursSince = (Date.now() - lastSameMed.timestamp) / (60 * 60 * 1000);
    if (hoursSince < 4) {
      const minutesUntilSafe = Math.ceil((4 - hoursSince) * 60);
      violations.push({
        type: 'too-soon-since-last-dose',
        severity: 'error',
        messageKey: 'error_too_soon',
        details: {
          minutesUntilSafe,
        },
      });
    }
  }

  return violations;
}

/**
 * Check if any medication in a list has conflicts with recent history
 */
export function hasAnyConflict(
  medicationIds: MedicationId[],
  intakeHistory: IntakeRecord[],
  medications: Medication[]
): boolean {
  const last24hrs = intakeHistory.filter(
    (i) => i.timestamp > Date.now() - 24 * 60 * 60 * 1000
  );

  for (const medId of medicationIds) {
    const med = medications.find((m) => m.id === medId);
    if (!med || !med.conflictsWith) continue;

    const hasConflict = last24hrs.some((intake) =>
      med.conflictsWith!.includes(intake.medicationId)
    );

    if (hasConflict) return true;
  }

  return false;
}
