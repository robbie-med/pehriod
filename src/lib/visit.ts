// Pre-visit questionnaire. Patients answer in plain words; the report shows each answer beside
// what the logs say, and marks disagreements. Logged data never replaces an answer.

export type QKind = 'yn' | 'yn3' | 'choice' | 'multi' | 'number' | 'date' | 'text';

export interface Question {
  id: string;
  kind: QKind;
  options?: readonly string[];
  /** Number questions: unit key and bounds. */
  unit?: 'days' | 'years' | 'count' | 'score' | 'height' | 'weight' | 'year';
  min?: number;
  max?: number;
}

export interface VisitSection {
  id: string;
  questions: Question[];
}

const yn = (id: string): Question => ({ id, kind: 'yn' });
const yn3 = (id: string): Question => ({ id, kind: 'yn3' });

export const VISIT: VisitSection[] = [
  {
    id: 'why',
    questions: [
      { id: 'reasons', kind: 'multi', options: ['pain', 'heavy', 'irregular', 'between', 'bc', 'pms', 'conceive', 'skin', 'other'] },
      { id: 'goals', kind: 'multi', options: ['less_pain', 'lighter', 'predictable', 'none', 'bc', 'baby'] },
    ],
  },
  {
    id: 'period',
    questions: [
      { id: 'lmp', kind: 'date' },
      { id: 'duration', kind: 'number', unit: 'days', min: 1, max: 30 },
      { id: 'gap', kind: 'number', unit: 'days', min: 10, max: 120 },
      yn('regular'),
      yn('heavy'),
      yn('soak'),
      yn('night'),
      yn('clots'),
      yn('flood'),
      yn('between'),
      yn('after_sex'),
      { id: 'menarche', kind: 'number', unit: 'years', min: 7, max: 20 },
    ],
  },
  {
    id: 'pain',
    questions: [
      { id: 'pain_worst', kind: 'number', unit: 'score', min: 0, max: 10 },
      { id: 'missed', kind: 'number', unit: 'days', min: 0, max: 15 },
      { id: 'meds_help', kind: 'choice', options: ['yes', 'some', 'no', 'none_taken'] },
      yn('pain_other'),
      yn('pain_sex'),
      yn('pain_toilet'),
      yn('pain_worse'),
    ],
  },
  {
    id: 'blood',
    questions: [yn3('anemia'), yn('tired'), yn('bruise'), yn('bleed_long'), yn3('family_bleed')],
  },
  {
    id: 'pregnancy',
    questions: [
      { id: 'birth_year', kind: 'number', unit: 'year', min: 1940, max: 2020 },
      yn3('pregnant_now'),
      yn('sex'),
      { id: 'pregnancies', kind: 'number', unit: 'count', min: 0, max: 20 },
      { id: 'births', kind: 'number', unit: 'count', min: 0, max: 20 },
      yn('recent_birth'),
      yn('breastfeeding'),
      { id: 'want_baby', kind: 'choice', options: ['soon', 'later', 'no', 'unsure'] },
    ],
  },
  {
    id: 'bc',
    questions: [
      { id: 'bc_now', kind: 'choice', options: ['none', 'condom', 'pill', 'patch', 'ring', 'shot', 'implant', 'iud_h', 'iud_cu', 'other'] },
      { id: 'bc_past', kind: 'text' },
    ],
  },
  {
    id: 'health',
    questions: [
      { id: 'smoke', kind: 'choice', options: ['no', 'under15', 'over15'] },
      yn('aura'),
      yn('clot'),
      yn3('clot_family'),
      yn3('bp'),
      yn('heart'),
      yn('breast_cancer'),
      yn('liver'),
      yn('diabetes'),
      yn('lupus'),
      yn('surgery_soon'),
      yn('seizure_tb'),
      { id: 'height', kind: 'number', unit: 'height', min: 50, max: 250 },
      { id: 'weight', kind: 'number', unit: 'weight', min: 20, max: 300 },
    ],
  },
  {
    id: 'other',
    questions: [
      { id: 'meds', kind: 'text' },
      { id: 'allergies', kind: 'text' },
      { id: 'operations', kind: 'text' },
      { id: 'pap', kind: 'choice', options: ['never', 'lt3', 'gt3', 'unsure'] },
      yn3('pap_bad'),
      { id: 'notes', kind: 'text' },
    ],
  },
];

export const ALL_QUESTIONS = VISIT.flatMap((s) => s.questions);

/** Answers keyed by question id. Numbers stored in metric; 'unsure' marks "not sure" on any kind. */
export type Answer = string | number | string[];
export type Answers = Record<string, Answer>;

export function isAnswered(a: Answer | undefined): boolean {
  if (a === undefined || a === '') return false;
  if (Array.isArray(a)) return a.length > 0;
  return true;
}

/** Questions whose "yes" is relevant to estrogen-containing contraception. Shown first in the report. */
export const ESTROGEN_ITEMS = ['aura', 'clot', 'clot_family', 'bp', 'heart', 'breast_cancer', 'liver', 'diabetes', 'lupus', 'surgery_soon', 'seizure_tb', 'recent_birth', 'breastfeeding'];
