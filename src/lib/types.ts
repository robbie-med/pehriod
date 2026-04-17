// ============================================
// LANGUAGE
// ============================================

export type Language = 'en' | 'ko';

// ============================================
// MEDICATIONS
// ============================================

export type MedicationId =
  | 'pamprin-multi'
  | 'pamprin-max-energy'
  | 'midol-complete'
  | 'ibuprofen'
  | 'naproxen'
  | 'acetaminophen';

export type ActiveIngredient =
  | 'acetaminophen'
  | 'ibuprofen'
  | 'naproxen'
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
  nameKey: string;
  composition: IngredientAmount[];
  color: 'pink' | 'orange' | 'blue' | 'green' | 'purple';
  descriptionKey: string;
  conflictsWith?: MedicationId[];
  minIntervalHours: number;
}

// ============================================
// INTAKE / DOSE TRACKING
// ============================================

export interface IntakeRecord {
  id: string;
  medicationId: MedicationId;
  timestamp: number;
  painLevel?: number;
}

export interface DoseTotals {
  acetaminophen: number;
  ibuprofen: number;
  naproxen: number;
  aspirin: number;
  caffeine: number;
  pamabrom: number;
  pyrilamine: number;
  lastUpdated: number;
}

export interface DoseLimit {
  ingredient: ActiveIngredient;
  maxDailyMg: number;
  warningThresholdMg?: number;
  isHardLimit: boolean;
}

// ============================================
// SAFETY
// ============================================

export type SafetyViolationType =
  | 'daily-limit-exceeded'
  | 'conflicting-medications'
  | 'too-soon-since-last-dose'
  | 'approaching-limit';

export interface SafetyViolation {
  type: SafetyViolationType;
  severity: 'error' | 'warning';
  messageKey: string;
  details?: {
    ingredient?: ActiveIngredient;
    currentMg?: number;
    limitMg?: number;
    conflictingMed?: MedicationId;
    minutesUntilSafe?: number;
  };
}

// ============================================
// CYCLE TRACKING
// ============================================

export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy';

export type SymptomType =
  | 'cramps'
  | 'bloating'
  | 'headache'
  | 'backache'
  | 'breast_tenderness'
  | 'fatigue'
  | 'nausea'
  | 'mood_changes'
  | 'acne';

export type MoodType = 'great' | 'good' | 'neutral' | 'low' | 'irritable' | 'anxious';

export interface CycleRecord {
  id: string;
  startDate: string;   // ISO date "2024-01-15"
  endDate?: string;    // ISO date, undefined = ongoing
  flowByDay: Record<string, FlowLevel>;
  notes?: string;
}

export interface DayLog {
  id: string;
  date: string;          // ISO date
  painLevel?: number;    // 0-10
  symptoms: SymptomType[];
  mood?: MoodType;
  notes?: string;
}

export interface CycleStats {
  totalCycles: number;
  averageCycleLength: number | null;
  averagePeriodLength: number | null;
  nextPredictedStart: string | null;   // ISO date
  currentCycleDay: number | null;
  isOnPeriod: boolean;
  currentPeriodDay: number | null;
}
