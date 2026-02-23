import { IntakeRecord, Medication, DoseTotals, ActiveIngredient } from './types';

/**
 * Calculate cumulative doses for all active ingredients
 * within the last 24 hours
 *
 * Algorithm:
 * 1. Filter intakes to last 24hrs (now - 86400000ms)
 * 2. For each intake, lookup medication composition
 * 3. Sum all ingredients
 * 4. Return totals object
 */
export function calculateDoseTotals(
  intakeHistory: IntakeRecord[],
  medications: Medication[]
): DoseTotals {
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  // Filter to last 24 hours
  const recentIntakes = intakeHistory.filter(
    (intake) => intake.timestamp > twentyFourHoursAgo
  );

  // Initialize totals
  const totals: Record<ActiveIngredient, number> = {
    acetaminophen: 0,
    ibuprofen: 0,
    aspirin: 0,
    caffeine: 0,
    pamabrom: 0,
    pyrilamine: 0,
  };

  // Sum all ingredients
  for (const intake of recentIntakes) {
    const med = medications.find((m) => m.id === intake.medicationId);
    if (!med) continue;

    for (const ingredient of med.composition) {
      totals[ingredient.ingredient] += ingredient.amountMg;
    }
  }

  return {
    ...totals,
    lastUpdated: now,
  };
}

/**
 * Get the most recent intake of a specific medication
 */
export function getLastIntake(
  medicationId: string,
  intakeHistory: IntakeRecord[]
): IntakeRecord | null {
  const intakes = intakeHistory
    .filter((i) => i.medicationId === medicationId)
    .sort((a, b) => b.timestamp - a.timestamp);

  return intakes[0] || null;
}

/**
 * Calculate hours since last dose of a medication
 */
export function getHoursSinceLastDose(
  medicationId: string,
  intakeHistory: IntakeRecord[]
): number | null {
  const lastIntake = getLastIntake(medicationId, intakeHistory);
  if (!lastIntake) return null;

  const hoursSince = (Date.now() - lastIntake.timestamp) / (60 * 60 * 1000);
  return hoursSince;
}
