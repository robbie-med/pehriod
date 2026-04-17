'use client';

import { useState } from 'react';
import { MedicationId, IntakeRecord, DoseTotals, SafetyViolation } from '../../lib/types';
import { MEDICATIONS } from '../../lib/medications';
import { DOSE_LIMITS } from '../../lib/doseLimits';
import { checkSafety } from '../../lib/safetyChecker';
import { getHoursSinceLastDose } from '../../lib/doseCalculator';
import { translations, Language } from '../../data/translations';

interface Props {
  intakeHistory: IntakeRecord[];
  doseTotals: DoseTotals;
  onLogIntake: (medId: MedicationId) => void;
  onDeleteIntake: (id: string) => void;
  lang: Language;
}

const colorClass: Record<string, string> = {
  pink: 'bg-pink-50 border-pink-200',
  orange: 'bg-orange-50 border-orange-200',
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
  purple: 'bg-purple-50 border-purple-200',
};

const dotColor: Record<string, string> = {
  pink: 'bg-pink-400',
  orange: 'bg-orange-400',
  blue: 'bg-blue-400',
  green: 'bg-green-400',
  purple: 'bg-purple-400',
};

function formatAgo(ms: number, t: (typeof translations)[Language]) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} ${t.meds_ago_min}`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} ${hr === 1 ? t.meds_ago_hr : t.meds_ago_hrs}`;
  return `${Math.round(hr / 24)} ${t.meds_ago_day}`;
}

function formatDate(ts: number, lang: Language) {
  const today = new Date();
  const d = new Date(ts);
  if (d.toDateString() === today.toDateString()) return 'today';
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'yesterday';
  return d.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' });
}

export function MedLogger({ intakeHistory, doseTotals, onLogIntake, onDeleteIntake, lang }: Props) {
  const t = translations[lang];
  const [confirmMed, setConfirmMed] = useState<MedicationId | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getStatus = (medId: MedicationId): { ok: boolean; violations: SafetyViolation[]; waitMin?: number } => {
    const violations = checkSafety(medId, doseTotals, intakeHistory, MEDICATIONS, DOSE_LIMITS);
    const errors = violations.filter((v) => v.severity === 'error');
    const tooSoon = errors.find((v) => v.type === 'too-soon-since-last-dose');
    return {
      ok: errors.length === 0,
      violations,
      waitMin: tooSoon?.details?.minutesUntilSafe,
    };
  };

  // Group history by date
  const sortedHistory = [...intakeHistory].sort((a, b) => b.timestamp - a.timestamp);

  const groupedHistory: { label: string; items: IntakeRecord[] }[] = [];
  for (const rec of sortedHistory) {
    const label = formatDate(rec.timestamp, lang);
    const labelDisplay = label === 'today' ? t.meds_today : label === 'yesterday' ? t.meds_yesterday : label;
    const group = groupedHistory.find((g) => g.label === labelDisplay);
    if (group) group.items.push(rec);
    else groupedHistory.push({ label: labelDisplay, items: [rec] });
  }

  const ingKey = (ing: string) => `ing_${ing}` as keyof typeof t;
  const medNameKey = (id: string) => {
    const med = MEDICATIONS.find((m) => m.id === id);
    return med?.nameKey as keyof typeof t;
  };

  return (
    <div className="space-y-4">
      {/* Medication cards */}
      {MEDICATIONS.map((med) => {
        const { ok, violations, waitMin } = getStatus(med.id as MedicationId);
        const warnings = violations.filter((v) => v.severity === 'warning');
        const errors = violations.filter((v) => v.severity === 'error');
        const hoursSince = getHoursSinceLastDose(med.id, intakeHistory);
        const lastIntake = intakeHistory
          .filter((i) => i.medicationId === med.id)
          .sort((a, b) => b.timestamp - a.timestamp)[0];

        const medName = t[med.nameKey as keyof typeof t] as string;
        const medDesc = t[med.descriptionKey as keyof typeof t] as string;

        return (
          <div
            key={med.id}
            className={`rounded-xl border p-4 ${colorClass[med.color]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor[med.color]}`} />
                  <p className="font-semibold text-gray-800 text-sm leading-tight">{medName}</p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 ml-4">{medDesc}</p>

                {lastIntake ? (
                  <p className="text-xs text-gray-400 mt-1 ml-4">
                    {t.meds_last_taken}: {formatAgo(Date.now() - lastIntake.timestamp, t)}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1 ml-4">{t.meds_not_taken}</p>
                )}

                {errors.length > 0 && (
                  <div className="mt-1 ml-4 space-y-0.5">
                    {errors.map((v, i) => (
                      <p key={i} className="text-xs text-red-600">
                        {waitMin
                          ? `${t.meds_wait} ${waitMin} ${t.meds_min}`
                          : t[v.messageKey as keyof typeof t] as string}
                      </p>
                    ))}
                  </div>
                )}
                {warnings.length > 0 && errors.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1 ml-4">
                    ⚠ {t.meds_warning}
                  </p>
                )}
              </div>

              <button
                onClick={() => ok ? setConfirmMed(med.id as MedicationId) : null}
                disabled={!ok}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  ok
                    ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {ok ? t.meds_log_dose : waitMin ? `${t.meds_wait} ${waitMin}m` : t.meds_blocked}
              </button>
            </div>
          </div>
        );
      })}

      {/* 24hr totals */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">{t.meds_24hr_totals}</h2>
        <div className="space-y-2">
          {(
            [
              ['acetaminophen', 3000],
              ['ibuprofen', 1200],
              ['naproxen', 660],
              ['aspirin', 4000],
              ['caffeine', 400],
            ] as const
          ).map(([ing, max]) => {
            const amt = doseTotals[ing] ?? 0;
            if (amt === 0) return null;
            const pct = Math.min((amt / max) * 100, 100);
            const color = pct > 80 ? 'bg-red-400' : pct > 60 ? 'bg-yellow-400' : 'bg-green-400';
            return (
              <div key={ing}>
                <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                  <span>{t[ingKey(ing)]}</span>
                  <span>{amt} / {max} mg</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {Object.values(doseTotals).filter((v, i) => i < 5 && v > 0).length === 0 && (
            <p className="text-sm text-gray-400">{t.meds_no_history}</p>
          )}
        </div>
      </div>

      {/* Dose history */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setShowHistory((v) => !v)}
        >
          <h2 className="font-semibold text-gray-800">{t.meds_history_title}</h2>
          <span className="text-gray-400">{showHistory ? '▲' : '▼'}</span>
        </button>

        {showHistory && (
          <div className="mt-3 space-y-3">
            {groupedHistory.length === 0 ? (
              <p className="text-sm text-gray-400">{t.meds_no_history}</p>
            ) : (
              groupedHistory.map(({ label, items }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  {items.map((rec) => {
                    const name = t[medNameKey(rec.medicationId)] as string;
                    const time = new Date(rec.timestamp).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit',
                    });
                    return (
                      <div key={rec.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm text-gray-700">{name}</p>
                          <p className="text-xs text-gray-400">{time}</p>
                        </div>
                        {deleteConfirm === rec.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => { onDeleteIntake(rec.id); setDeleteConfirm(null); }}
                              className="text-xs text-red-600 font-medium">{t.meds_delete}</button>
                            <button onClick={() => setDeleteConfirm(null)}
                              className="text-xs text-gray-400">{t.meds_cancel}</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(rec.id)}
                            className="text-xs text-gray-300 hover:text-red-400">✕</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirmMed && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 pb-safe">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6">
            <p className="text-base font-semibold text-gray-800 mb-1">{t.meds_confirm_title}</p>
            <p className="text-sm text-gray-600 mb-4">
              {t.meds_confirm_msg} {t[medNameKey(confirmMed)] as string}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmMed(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm"
              >
                {t.meds_cancel}
              </button>
              <button
                onClick={() => { onLogIntake(confirmMed); setConfirmMed(null); }}
                className="flex-1 py-2.5 bg-pink-500 text-white rounded-xl text-sm font-medium"
              >
                {t.meds_confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
