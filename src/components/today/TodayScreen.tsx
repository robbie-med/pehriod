'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import {
  BleedEntry, CycleRecord, CycleStats, DayLog, IntakeRecord, MoodType, Relief, SymptomType, TrackerValue,
} from '../../lib/types';
import { Prefs } from '../../lib/storage';
import { DayPatch } from '../../hooks/useCycleData';
import { MEDICATIONS } from '../../lib/medications';
import { NSAIDS, pendingRelief } from '../../lib/relief';
import { entriesBetween, entriesOn } from '../../lib/pbac';
import { suggestedEnd, defaultEndDate } from '../../lib/period';
import { daysUntil, isoOfTs, isoToDate } from '../../lib/dates';
import { trackerDef } from '../../lib/trackers';
import { T, fmt, locale, Language } from '../../data/translations';
import { Chip, Section, cx } from '../ui/kit';
import { BleedLogger } from './BleedLogger';
import { ReliefAsk } from './ReliefAsk';
import { TrackerRow } from './TrackerRow';
import { BackupReminder } from '../ui/BackupReminder';

const SYMPTOMS: SymptomType[] = ['cramps', 'backache', 'headache', 'bloating', 'breast_tenderness', 'fatigue', 'nausea', 'mood_changes', 'acne'];
const MOODS: MoodType[] = ['great', 'good', 'neutral', 'low', 'irritable', 'anxious'];

interface Props {
  t: T;
  lang: Language;
  today: string;
  now: number;
  stats: CycleStats;
  cycles: CycleRecord[];
  bleeds: BleedEntry[];
  dayLog: DayLog | undefined;
  dayLogs: DayLog[];
  intakes: IntakeRecord[];
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
  onBleed: (e: Omit<BleedEntry, 'id' | 'ts'>) => void;
  onRemoveBleed: (e: BleedEntry) => void;
  onDay: (patch: DayPatch) => void;
  onRelief: (id: string, r: Relief | null) => void;
  onEndPeriod: (date: string) => void;
  onGoMeds: () => void;
}

export function TodayScreen(p: Props) {
  const { t, lang, today, now, stats, cycles, bleeds, dayLog, prefs } = p;
  const [openLogger, setOpenLogger] = useState(false);
  const [dismissedEnd, setDismissedEnd] = useState<string | null>(null);
  const [notes, setNotes] = useState(dayLog?.notes ?? '');

  const ongoing = cycles.find((c) => !c.endDate);
  const todayEntries = entriesOn(bleeds, today).sort((a, b) => a.ts - b.ts);
  const periodEntries = ongoing ? entriesBetween(bleeds, ongoing.startDate, today) : todayEntries;
  const endSuggestion = suggestedEnd(cycles, bleeds, today);
  const asks = pendingRelief(p.intakes, now);
  const todayIntakes = p.intakes.filter((i) => isoOfTs(i.timestamp) === today).sort((a, b) => b.timestamp - a.timestamp);
  const untilNext = stats.nextPredictedStart ? daysUntil(stats.nextPredictedStart) : null;
  const nearPeriod = untilNext !== null && untilNext <= 3;
  const showPreempt = !stats.isOnPeriod && untilNext !== null && untilNext >= 0 && untilNext <= 2 &&
    !todayIntakes.some((i) => NSAIDS.includes(i.medicationId));
  const loggerOpen = stats.isOnPeriod || nearPeriod || todayEntries.length > 0 || openLogger || cycles.length === 0;

  const dateLine = isoToDate(today).toLocaleDateString(locale(lang), { weekday: 'short', month: 'short', day: 'numeric' });

  let big: string;
  let sub: string;
  if (stats.isOnPeriod && stats.currentPeriodDay) {
    big = fmt(t.day_n, { n: stats.currentPeriodDay });
    sub = t.on_period;
  } else if (stats.currentCycleDay) {
    big = fmt(t.day_n, { n: stats.currentCycleDay });
    sub = untilNext === null ? t.cycle_day
      : untilNext < 0 ? t.period_late
      : untilNext === 0 ? t.period_today
      : untilNext === 1 ? t.period_tomorrow
      : fmt(t.period_in_n, { n: untilNext });
  } else {
    big = t.today;
    sub = t.start_hint;
  }

  const values = dayLog?.values ?? {};
  const setValue = (id: string, v: TrackerValue | undefined) => p.onDay({ values: { [id]: v } as Record<string, TrackerValue> });
  const previousValue = (id: string): TrackerValue | undefined => {
    let best: DayLog | undefined;
    for (const l of p.dayLogs) {
      if (l.date < today && l.values?.[id] !== undefined && (!best || l.date > best.date)) best = l;
    }
    return best?.values?.[id];
  };

  const symptoms = dayLog?.symptoms ?? [];
  const toggleSymptom = (s: SymptomType) =>
    p.onDay({ symptoms: symptoms.includes(s) ? symptoms.filter((x) => x !== s) : [...symptoms, s] });

  return (
    <div>
      <header className="pt-2">
        <p className="text-sm text-t3">{dateLine}</p>
        <h1 className="num mt-1 text-[56px] font-extrabold leading-none tracking-tight">{big}</h1>
        <p className={cx('mt-1.5 text-lg', stats.isOnPeriod ? 'text-accent font-semibold' : 'text-t2')}>{sub}</p>
      </header>

      <BackupReminder t={t} />

      {asks.length > 0 && (
        <div className="mt-4">
          {asks.map((i) => <ReliefAsk key={i.id} t={t} intake={i} onRate={(r) => p.onRelief(i.id, r)} />)}
        </div>
      )}

      {endSuggestion && dismissedEnd !== endSuggestion && (
        <div className="mt-4 flex items-center gap-2 border-b border-line py-2">
          <span className="flex-1 text-[17px]">
            {fmt(t.ended_q, { date: isoToDate(endSuggestion).toLocaleDateString(locale(lang), { month: 'short', day: 'numeric' }) })}
          </span>
          <Chip on onClick={() => p.onEndPeriod(endSuggestion)}><Check size={16} />{t.yes}</Chip>
          <button onClick={() => setDismissedEnd(endSuggestion)} aria-label={t.skip} className="press flex h-10 w-10 items-center justify-center text-t3"><X size={18} /></button>
        </div>
      )}

      {showPreempt && (
        <div className="mt-4 flex items-center gap-3 border-b border-line py-2">
          <span className="flex-1 text-[15px] text-t2">{t.preempt}</span>
          <Chip onClick={p.onGoMeds}>{t.nav_meds}</Chip>
        </div>
      )}

      <Section
        title={t.bleeding}
        right={ongoing && (
          <button onClick={() => p.onEndPeriod(defaultEndDate(ongoing, bleeds, today))} className="press text-[15px] font-semibold text-accent">
            {t.end_period}
          </button>
        )}
      >
        {loggerOpen ? (
          <BleedLogger
            t={t}
            prefs={prefs}
            setPrefs={p.setPrefs}
            onLog={p.onBleed}
            onRemove={p.onRemoveBleed}
            todayEntries={todayEntries}
            periodEntries={periodEntries}
          />
        ) : (
          <button onClick={() => setOpenLogger(true)} className="press h-14 w-full rounded-2xl bg-raise text-[17px] font-semibold">
            {t.log_bleeding}
          </button>
        )}
      </Section>

      <Section title={t.pain}>
        <div className="grid grid-cols-11 gap-1">
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              onClick={() => p.onDay({ painLevel: dayLog?.painLevel === n ? undefined : n })}
              aria-pressed={dayLog?.painLevel === n}
              className={cx(
                'press num h-12 rounded-lg text-[17px] font-bold',
                dayLog?.painLevel === n ? 'bg-accent text-on-accent' : 'bg-raise text-t2'
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-t2">{t.missed_day}</span>
          <Chip on={values.missed === true} onClick={() => setValue('missed', values.missed === true ? undefined : true)}>
            {values.missed === true ? t.yes : t.no}
          </Chip>
        </div>
      </Section>

      <Section title={t.symptoms}>
        <div className="flex flex-wrap gap-1.5">
          {SYMPTOMS.map((s) => (
            <Chip key={s} on={symptoms.includes(s)} onClick={() => toggleSymptom(s)}>{t[`sym_${s}`]}</Chip>
          ))}
        </div>
      </Section>

      <Section title={t.mood}>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map((m) => (
            <Chip key={m} on={dayLog?.mood === m} onClick={() => p.onDay({ mood: dayLog?.mood === m ? undefined : m })}>{t[`mood_${m}`]}</Chip>
          ))}
        </div>
      </Section>

      {prefs.trackers.length > 0 && (
        <Section title={t.body}>
          {prefs.trackers.map((id) => (
            <TrackerRow
              key={id}
              t={t}
              def={trackerDef(id)}
              value={values[id]}
              previous={previousValue(id)}
              units={prefs.units}
              onChange={(v) => setValue(id, v)}
            />
          ))}
        </Section>
      )}

      <Section title={t.notes}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => p.onDay({ notes: notes.trim() || undefined })}
          rows={2}
          className="field resize-none"
        />
      </Section>

      {todayIntakes.length > 0 && (
        <Section title={t.meds_today} right={<button onClick={p.onGoMeds} className="press text-[15px] font-semibold text-accent">{t.nav_meds}</button>}>
          {todayIntakes.map((i) => {
            const med = MEDICATIONS.find((m) => m.id === i.medicationId);
            return (
              <div key={i.id} className="flex items-center justify-between border-b border-line py-3">
                <span>{med ? (t[med.nameKey as keyof T] as string) : i.medicationId}</span>
                <span className="num text-t3">{new Date(i.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            );
          })}
        </Section>
      )}
    </div>
  );
}
