'use client';

import { useState } from 'react';
import { CycleStats, IntakeRecord, DayLog, SymptomType, MoodType } from '../../lib/types';
import { MEDICATIONS } from '../../lib/medications';
import { daysUntil, todayISO } from '../../lib/cycleCalculator';
import { translations, Language } from '../../data/translations';
import { SmartDosePlan } from '../features/SmartDosePlan';

interface Props {
  stats: CycleStats;
  intakeHistory: IntakeRecord[];
  painLevel: number;
  onPainChange: (v: number) => void;
  dayLog: DayLog | undefined;
  onSaveDayLog: (log: Omit<DayLog, 'id'>) => void;
  onGoToMeds: () => void;
  onGoToCycle: () => void;
  lang: Language;
}

const SYMPTOMS: SymptomType[] = [
  'cramps', 'bloating', 'headache', 'backache',
  'breast_tenderness', 'fatigue', 'nausea', 'mood_changes', 'acne',
];

const MOODS: MoodType[] = ['great', 'good', 'neutral', 'low', 'irritable', 'anxious'];

export function TodayDashboard({
  stats, intakeHistory, painLevel, onPainChange,
  dayLog, onSaveDayLog, onGoToMeds, onGoToCycle, lang,
}: Props) {
  const t = translations[lang];
  const today = todayISO();

  const [showLog, setShowLog] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>(
    dayLog?.symptoms ?? []
  );
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>(dayLog?.mood);
  const [notes, setNotes] = useState(dayLog?.notes ?? '');
  const [localPain, setLocalPain] = useState(dayLog?.painLevel ?? painLevel);
  const [saved, setSaved] = useState(false);

  const todayIntakes = intakeHistory.filter((i) => {
    const d = new Date(i.timestamp).toISOString().split('T')[0];
    return d === today;
  });

  const showPreemptAlert = (() => {
    if (stats.isOnPeriod || !stats.nextPredictedStart) return false;
    const days = daysUntil(stats.nextPredictedStart);
    if (days < 0 || days > 2) return false;
    const todayNsaid = todayIntakes.some((i) => i.medicationId === 'ibuprofen' || i.medicationId === 'naproxen');
    return !todayNsaid;
  })();

  const cycleStatus = () => {
    if (stats.totalCycles === 0) {
      return (
        <button onClick={onGoToCycle} className="text-pink-600 text-sm font-medium underline">
          {t.today_not_tracking}
        </button>
      );
    }
    if (stats.isOnPeriod && stats.currentPeriodDay) {
      return (
        <span className="text-red-600 font-semibold">
          🔴 {t.today_period_active} · {t.today_period_day}{stats.currentPeriodDay}
        </span>
      );
    }
    if (stats.currentCycleDay) {
      return (
        <span className="text-gray-700">
          {t.today_cycle_day}{stats.currentCycleDay}
        </span>
      );
    }
    return null;
  };

  const nextPeriodLine = () => {
    if (!stats.nextPredictedStart || stats.isOnPeriod) return null;
    const days = daysUntil(stats.nextPredictedStart);
    let label = '';
    if (days < 0) label = t.today_overdue;
    else if (days === 0) label = `${t.today_next_period} ${t.today_next_period_today}`;
    else if (days === 1) label = `${t.today_next_period} ${t.today_next_period_tomorrow}`;
    else label = `${t.today_next_period} ${days} ${t.today_next_period_days}`;
    return <span className="text-xs text-gray-500">{label}</span>;
  };

  const toggleSymptom = (s: SymptomType) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSave = () => {
    onPainChange(localPain);
    onSaveDayLog({
      date: today,
      painLevel: localPain,
      symptoms: selectedSymptoms,
      mood: selectedMood,
      notes: notes.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowLog(false);
    }, 1000);
  };

  const symKey = (s: SymptomType) => `sym_${s}` as keyof typeof t;
  const moodKey = (m: MoodType) => `mood_${m}` as keyof typeof t;

  return (
    <div className="space-y-4">
      {/* Cycle status card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              {cycleStatus()}
              {nextPeriodLine()}
            </div>
            <button
              onClick={onGoToCycle}
              className="text-xs text-pink-500 underline"
            >
              {t.nav_cycle}
            </button>
          </div>
        </div>
      </div>

      {/* Pre-emptive dosing alert */}
      {showPreemptAlert && (
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <p className="font-semibold text-yellow-800 text-sm mb-1">⚡ {t.preempt_title}</p>
          <p className="text-xs text-yellow-700 leading-relaxed mb-3">{t.preempt_body}</p>
          <button
            onClick={onGoToMeds}
            className="text-xs font-medium text-yellow-900 bg-yellow-200 px-3 py-1.5 rounded-lg"
          >
            {t.preempt_cta} →
          </button>
        </div>
      )}

      {/* Pain + symptom log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">{t.today_pain_label}</h2>
          <button
            onClick={() => setShowLog((v) => !v)}
            className="text-xs text-pink-600 underline"
          >
            {t.today_log_symptoms}
          </button>
        </div>

        {/* Pain bar */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={10}
            value={localPain}
            onChange={(e) => setLocalPain(Number(e.target.value))}
            className="flex-1 accent-pink-500"
          />
          <span className="text-2xl font-bold text-pink-600 w-8 text-right">
            {localPain}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>{t.today_no_pain}</span>
          <span>10</span>
        </div>

        {/* Expanded day log */}
        {showLog && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Symptoms */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t.daylog_symptoms}</p>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      selectedSymptoms.includes(s)
                        ? 'bg-pink-100 border-pink-400 text-pink-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {t[symKey(s)]}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t.daylog_mood}</p>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMood(m === selectedMood ? undefined : m)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      selectedMood === m
                        ? 'bg-pink-100 border-pink-400 text-pink-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {t[moodKey(m)]}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">{t.daylog_notes}</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.daylog_notes_placeholder}
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-pink-300"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full py-2 bg-pink-500 text-white rounded-lg text-sm font-medium"
            >
              {saved ? `✓ ${t.daylog_saved}` : t.daylog_save}
            </button>
          </div>
        )}
      </div>

      {/* Today's meds summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">{t.today_meds_taken}</h2>
          <button onClick={onGoToMeds} className="text-xs text-pink-600 underline">
            {t.today_quick_dose}
          </button>
        </div>
        {todayIntakes.length === 0 ? (
          <p className="text-sm text-gray-400">{t.today_no_meds}</p>
        ) : (
          <div className="space-y-1">
            {todayIntakes
              .slice()
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((intake) => {
                const med = MEDICATIONS.find((m) => m.id === intake.medicationId);
                const medNameKey = med?.nameKey as keyof typeof t;
                const time = new Date(intake.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div key={intake.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{t[medNameKey]}</span>
                    <span className="text-gray-400">{time}</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Smart dose plan */}
      <SmartDosePlan intakeHistory={intakeHistory} lang={lang} />
    </div>
  );
}
