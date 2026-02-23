// ============================================
// MEDICATION DEFINITIONS
// ============================================

export type MedicationId =
  | 'pamprin-multi'
  | 'pamprin-max-energy'
  | 'midol-complete'
  | 'ibuprofen'
  | 'acetaminophen';

export type ActiveIngredient =
  | 'acetaminophen'
  | 'ibuprofen'
  | 'aspirin'
  | 'caffeine'
  | 'pamabrom'
  | 'pyrilamine';

export interface IngredientAmount {
  ingredient: ActiveIngredient;
  amountMg: number;
}

export interface Medication {
  id: MedicationId;
  nameKey: string;                    // Translation key
  composition: IngredientAmount[];     // What's in each dose
  color: 'pink' | 'orange' | 'blue' | 'green';  // UI color coding
  descriptionKey: string;              // Translation key for description
  conflictsWith?: MedicationId[];      // Mutual exclusion (e.g., Pamprin Max <-> Midol)
}

// ============================================
// SCHEDULE
// ============================================

export interface ScheduledDose {
  time: string;                        // "01:00", "05:00", etc (24hr format)
  medications: MedicationId[];          // Allowed medications at this time
  isChoice?: boolean;                  // True for 09:00 (choose Pamprin Max OR Midol)
}

// ============================================
// INTAKE HISTORY
// ============================================

export interface IntakeRecord {
  id: string;                          // UUID
  medicationId: MedicationId;
  timestamp: number;                   // Unix timestamp (ms)
  scheduledTime?: string;              // "09:00" - which schedule slot (optional)
  painLevel?: number;                  // 0-10 pain at time of intake
}

// ============================================
// DOSE TRACKING
// ============================================

export interface DoseTotals {
  acetaminophen: number;
  ibuprofen: number;
  aspirin: number;
  caffeine: number;
  pamabrom: number;
  pyrilamine: number;
  lastUpdated: number;                 // Timestamp of calculation
}

export interface DoseLimit {
  ingredient: ActiveIngredient;
  maxDailyMg: number;
  warningThresholdMg?: number;         // Optional warning at 80% of max
  isHardLimit: boolean;                // true = block, false = warn only
}

// ============================================
// SAFETY & RECOMMENDATIONS
// ============================================

export type SafetyViolationType =
  | 'daily-limit-exceeded'
  | 'conflicting-medications'
  | 'too-soon-since-last-dose'
  | 'approaching-limit';

export interface SafetyViolation {
  type: SafetyViolationType;
  severity: 'error' | 'warning';
  messageKey: string;                  // Translation key
  details?: {
    ingredient?: ActiveIngredient;
    currentMg?: number;
    limitMg?: number;
    conflictingMed?: MedicationId;
    minutesUntilSafe?: number;
  };
}

export interface Recommendation {
  scheduledTime: string;               // "09:00"
  recommendedMedications: MedicationId[];
  availableAt: number;                 // Unix timestamp when safe to take
  isSafeNow: boolean;
  violations: SafetyViolation[];       // Warnings/errors if user tries to take now
}

// ============================================
// APP STATE
// ============================================

export interface AppState {
  intakeHistory: IntakeRecord[];
  currentPainLevel: number;            // 0-10
  preferredLanguage: string;           // Language code
}
