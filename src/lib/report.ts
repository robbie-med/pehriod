import { BleedEntry, CycleRecord, DayLog, IntakeRecord, MedicationId } from './types';
import { addDays, daysBetween, isoOfTs, monthKey, todayISO } from './dates';
import { sortCycles } from './cycleCalculator';
import { entriesBetween, isHeavy, summarize } from './pbac';
import { NSAIDS, earlyVsOnset, nsaidNonResponse, reliefStats } from './relief';
import { MEDICATIONS } from './medications';

// FIGO System 1 (Munro et al. 2018), ages 18-45: normal frequency 24-38 days,
// duration <= 8 days, shortest-to-longest cycle variation <= 7-9 days depending on age.
export const FIGO = { minLen: 24, maxLen: 38, maxDuration: 8, regularMax: 7, irregularMin: 10 };

export interface ReportCycle {
  start: string;
  end: string | null;
  length: number | null;
  duration: number | null;
  score: number;
  ml: number;
  logged: boolean;
  floods: number;
  clotsLarge: number;
  peakPain: number | null;
  missed: number;
  heavy: boolean;
}

export type Frequency = 'normal' | 'frequent' | 'infrequent';
export type Regularity = 'regular' | 'borderline' | 'irregular';

export interface ReportData {
  today: string;
  cycles: ReportCycle[];
  medianLength: number | null;
  variation: number | null;
  frequency: Frequency | null;
  regularity: Regularity | null;
  prolonged: number;
  withDuration: number;
  heavy: number;
  withBleeds: number;
  floods: number;
  nsaidDays: { month: string; days: number }[];
  relief: { medId: MedicationId; rated: number; helped: number }[];
  nsaid: ReturnType<typeof nsaidNonResponse>;
  early: ReturnType<typeof earlyVsOnset>;
  flags: ('heavy' | 'nsaid' | 'frequent' | 'infrequent' | 'irregular' | 'prolonged' | 'flooding')[];
}

const MAX_CYCLES = 6;

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export function buildReport(
  cycles: CycleRecord[],
  bleeds: BleedEntry[],
  dayLogs: DayLog[],
  intakes: IntakeRecord[],
  today: string = todayISO()
): ReportData {
  const sorted = sortCycles(cycles).filter((c) => c.startDate <= today);
  const logByDate = new Map(dayLogs.map((l) => [l.date, l]));

  const all: ReportCycle[] = sorted.map((c, i) => {
    const next = sorted[i + 1];
    const periodEnd = c.endDate ?? today;
    const cycleEnd = next ? addDays(next.startDate, -1) : today;
    const s = summarize(entriesBetween(bleeds, c.startDate, periodEnd));

    let peakPain: number | null = null;
    for (let d = c.startDate; d <= periodEnd; d = addDays(d, 1)) {
      const p = logByDate.get(d)?.painLevel;
      if (p != null && (peakPain === null || p > peakPain)) peakPain = p;
    }
    let missed = 0;
    for (let d = c.startDate; d <= cycleEnd; d = addDays(d, 1)) {
      if (logByDate.get(d)?.values?.missed === true) missed++;
    }

    return {
      start: c.startDate,
      end: c.endDate ?? null,
      length: next ? daysBetween(c.startDate, next.startDate) : null,
      duration: c.endDate ? daysBetween(c.startDate, c.endDate) + 1 : null,
      score: s.score,
      ml: s.ml,
      logged: s.pads + s.tampons + s.cups > 0,
      floods: s.floods,
      clotsLarge: s.clotsLarge,
      peakPain,
      missed,
      heavy: isHeavy(s),
    };
  });

  const recent = all.slice(-MAX_CYCLES - 1);
  const lengths = recent.map((c) => c.length).filter((l): l is number => l !== null && l < 180);
  const medianLength = median(lengths);
  const variation = lengths.length >= 2 ? Math.max(...lengths) - Math.min(...lengths) : null;

  const frequency: Frequency | null =
    medianLength === null ? null : medianLength < FIGO.minLen ? 'frequent' : medianLength > FIGO.maxLen ? 'infrequent' : 'normal';
  const regularity: Regularity | null =
    variation === null ? null : variation <= FIGO.regularMax ? 'regular' : variation >= FIGO.irregularMin ? 'irregular' : 'borderline';

  const shown = recent.slice(-MAX_CYCLES).reverse();
  const withDuration = shown.filter((c) => c.duration !== null);
  const prolonged = withDuration.filter((c) => c.duration! > FIGO.maxDuration).length;
  const bled = shown.filter((c) => c.logged);
  const heavy = bled.filter((c) => c.heavy).length;
  const floods = shown.reduce((n, c) => n + c.floods, 0);

  const nsaidDays: { month: string; days: number }[] = [];
  const thisMonth = monthKey(today);
  const months = [0, 1, 2].map((k) => {
    const [y, m] = thisMonth.split('-').map(Number);
    const d = new Date(y, m - 1 - k, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  for (const month of months) {
    const days = new Set(
      intakes
        .filter((i) => NSAIDS.includes(i.medicationId))
        .map((i) => isoOfTs(i.timestamp))
        .filter((d) => monthKey(d) === month)
    );
    nsaidDays.push({ month, days: days.size });
  }

  const relief = MEDICATIONS.map((m) => {
    const r = reliefStats(intakes, [m.id]);
    return { medId: m.id, rated: r.rated, helped: r.helped };
  }).filter((r) => r.rated > 0);

  const nsaid = nsaidNonResponse(intakes, cycles);
  const early = earlyVsOnset(sorted, intakes, dayLogs);

  const flags: ReportData['flags'] = [];
  if (heavy > 0) flags.push('heavy');
  if (nsaid.flagged) flags.push('nsaid');
  if (frequency === 'frequent') flags.push('frequent');
  if (frequency === 'infrequent') flags.push('infrequent');
  if (regularity === 'irregular') flags.push('irregular');
  if (prolonged > 0) flags.push('prolonged');
  if (floods > 0) flags.push('flooding');

  return {
    today,
    cycles: shown,
    medianLength,
    variation,
    frequency,
    regularity,
    prolonged,
    withDuration: withDuration.length,
    heavy,
    withBleeds: bled.length,
    floods,
    nsaidDays: nsaidDays.reverse(),
    relief,
    nsaid,
    early,
    flags,
  };
}
