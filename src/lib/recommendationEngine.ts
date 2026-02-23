import {
  ScheduledDose,
  IntakeRecord,
  DoseTotals,
  Medication,
  DoseLimit,
  Recommendation,
  MedicationId,
} from './types';
import { checkSafety } from './safetyChecker';

/**
 * Generate recommendations for what to take next
 *
 * Algorithm:
 * 1. Find next scheduled dose based on current time
 * 2. For each medication option at that time:
 *    - Check safety (limits, conflicts, timing)
 *    - Calculate when it becomes safe
 * 3. Return recommendation object
 *
 * Example: At 08:45, recommend 09:00 slot (Pamprin Max OR Midol)
 *          If user took Pamprin Max at 02:00, block both until tomorrow
 */
export function getNextRecommendation(
  schedule: ScheduledDose[],
  intakeHistory: IntakeRecord[],
  currentTotals: DoseTotals,
  medications: Medication[],
  doseLimits: DoseLimit[]
): Recommendation | null {
  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes(); // e.g., 845 for 8:45am

  // Find next scheduled dose
  const sortedSchedule = schedule
    .map((s) => ({
      ...s,
      timeNum: parseInt(s.time.replace(':', '')), // "09:00" -> 900
    }))
    .sort((a, b) => a.timeNum - b.timeNum);

  let nextDose = sortedSchedule.find((s) => s.timeNum > currentTime);
  if (!nextDose) {
    // Wrap around to next day (first dose)
    nextDose = sortedSchedule[0];
  }

  if (!nextDose) return null;

  // Check safety for each medication option
  const recommendations: MedicationId[] = [];
  const allViolations: SafetyViolation[] = [];
  let earliestAvailable = Date.now();

  for (const medId of nextDose.medications) {
    const violations = checkSafety(
      medId,
      currentTotals,
      intakeHistory,
      medications,
      doseLimits
    );

    if (violations.length === 0) {
      recommendations.push(medId);
    } else {
      allViolations.push(...violations);

      // Calculate when this med becomes safe
      const timingViolation = violations.find(
        (v) => v.type === 'too-soon-since-last-dose'
      );
      if (timingViolation?.details?.minutesUntilSafe) {
        const availableAt =
          Date.now() + timingViolation.details.minutesUntilSafe * 60 * 1000;
        earliestAvailable = Math.max(earliestAvailable, availableAt);
      }
    }
  }

  // If it's a choice slot (09:00), and one option has conflicts, remove both
  if (nextDose.isChoice) {
    const hasConflict = allViolations.some(
      (v) => v.type === 'conflicting-medications'
    );
    if (hasConflict) {
      return {
        scheduledTime: nextDose.time,
        recommendedMedications: [],
        availableAt: earliestAvailable,
        isSafeNow: false,
        violations: allViolations,
      };
    }
  }

  return {
    scheduledTime: nextDose.time,
    recommendedMedications: recommendations,
    availableAt: earliestAvailable,
    isSafeNow: recommendations.length > 0,
    violations: allViolations,
  };
}

/**
 * Check if a specific scheduled dose has been taken recently
 */
export function hasBeenTakenRecently(
  scheduledTime: string,
  intakeHistory: IntakeRecord[],
  withinHours: number = 4
): boolean {
  const cutoff = Date.now() - withinHours * 60 * 60 * 1000;
  return intakeHistory.some(
    (intake) =>
      intake.scheduledTime === scheduledTime && intake.timestamp > cutoff
  );
}
