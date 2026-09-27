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
  /** Tablets per logged dose, when more than one. */
  tablets?: number;
}

// ============================================
// INTAKE / DOSE TRACKING
// ============================================

/** Standard 5-point categorical pain relief scale: none, a little, some, a lot, complete. */
export type Relief = 0 | 1 | 2 | 3 | 4;

export interface IntakeRecord {
  id: string;
  medicationId: MedicationId;
  timestamp: number;
  /** Pain 0-10 when the dose was taken. */
  painLevel?: number;
  /** undefined = not asked yet, null = skipped. */
  relief?: Relief | null;
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
// BLEEDING
// ============================================

export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy';

export type Product = 'pad' | 'tampon' | 'cup' | 'liner';
export type BleedKind = Product | 'clot' | 'flood';

/** How soaked a pad or tampon was at change: lightly stained, moderately soiled, saturated. */
export type Fill = 1 | 2 | 3;

export interface BleedEntry {
  id: string;
  ts: number;
  kind: BleedKind;
  /** Absorbency tier 1-5 for pads and tampons. */
  size?: number;
  fill?: Fill;
  /** Cup contents in mL. */
  ml?: number;
  /** Clot size: false = small, true = large. */
  big?: boolean;
}

// ============================================
// CYCLE TRACKING
// ============================================

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
  startDate: string;   // local ISO date
  endDate?: string;    // undefined = ongoing
  /** Manually chosen flow per day. Days with bleed entries use the measured level instead. */
  flowByDay: Record<string, FlowLevel>;
  notes?: string;
}

export type TrackerValue = number | string | boolean;

export interface DayLog {
  id: string;
  date: string;
  painLevel?: number;    // 0-10
  symptoms: SymptomType[];
  mood?: MoodType;
  notes?: string;
  values?: Record<string, TrackerValue>;
}

export type CycleRegularity = 'very_regular' | 'regular' | 'somewhat_irregular' | 'irregular' | 'unknown';

/** Legacy (schema 1). Migrated into DayLog.values. */
export type CalendarEventType = 'stress' | 'travel' | 'timezone' | 'illness' | 'exercise' | 'other';

export interface CalendarEvent {
  id: string;
  date: string;
  type: CalendarEventType;
  notes?: string;
}

export interface PredictedCycle {
  periodStart: string;
  ovulationDay: string;
  fertileStart: string;
  fertileEnd: string;
}

export interface CycleStats {
  totalCycles: number;
  averageCycleLength: number | null;
  averagePeriodLength: number | null;
  cycleVariation: number | null;        // std dev of cycle lengths in days
  regularity: CycleRegularity;
  nextPredictedStart: string | null;
  fertileWindowStart: string | null;
  fertileWindowEnd: string | null;
  ovulationDay: string | null;
  isFertileNow: boolean;
  currentCycleDay: number | null;
  isOnPeriod: boolean;
  currentPeriodDay: number | null;
  upcomingCycles: PredictedCycle[];     // up to 1 year of future predictions
}
