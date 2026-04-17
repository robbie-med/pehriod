import { IntakeRecord, Medication, DoseTotals, ActiveIngredient } from './types';

export function calculateDoseTotals(
  intakeHistory: IntakeRecord[],
  medications: Medication[]
): DoseTotals {
  const now = Date.now();
  const recentIntakes = intakeHistory.filter(
    (i) => i.timestamp > now - 24 * 60 * 60 * 1000
  );

  const totals: Record<ActiveIngredient, number> = {
    acetaminophen: 0,
    ibuprofen: 0,
    naproxen: 0,
    aspirin: 0,
    caffeine: 0,
    pamabrom: 0,
    pyrilamine: 0,
  };

  for (const intake of recentIntakes) {
    const med = medications.find((m) => m.id === intake.medicationId);
    if (!med) continue;
    for (const ingredient of med.composition) {
      totals[ingredient.ingredient] += ingredient.amountMg;
    }
  }

  return { ...totals, lastUpdated: now };
}

export function getLastIntake(
  medicationId: string,
  intakeHistory: IntakeRecord[]
): IntakeRecord | null {
  const sorted = intakeHistory
    .filter((i) => i.medicationId === medicationId)
    .sort((a, b) => b.timestamp - a.timestamp);
  return sorted[0] || null;
}

export function getHoursSinceLastDose(
  medicationId: string,
  intakeHistory: IntakeRecord[]
): number | null {
  const last = getLastIntake(medicationId, intakeHistory);
  if (!last) return null;
  return (Date.now() - last.timestamp) / (60 * 60 * 1000);
}
