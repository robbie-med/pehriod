'use client';

import { useState } from 'react';
import { Language, languages } from '../../data/translations';
import { translations } from '../../data/translations';
import { exportAllData, clearAllStorage } from '../../lib/storage';
import { useTheme, ThemeMode } from '../ui/ThemeProvider';
import { CycleRecord, CycleStats, IntakeRecord, DayLog, SymptomType } from '../../lib/types';
import { MEDICATIONS } from '../../lib/medications';

interface Props {
  lang: Language;
  onLanguageChange: (l: Language) => void;
  onClearAll: () => void;
  cycles: CycleRecord[];
  stats: CycleStats;
  intakeHistory: IntakeRecord[];
  dayLogs: DayLog[];
}

function buildAppointmentSummary(
  t: (typeof translations)[Language],
  cycles: CycleRecord[],
  stats: CycleStats,
  intakeHistory: IntakeRecord[],
  dayLogs: DayLog[],
  lang: Language
): string {
  if (cycles.length < 2) return t.appt_no_data;

  const date = new Date().toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const regularityLabels: Record<string, string> = {
    very_regular: lang === 'ko' ? '매우 규칙적' : 'Very regular',
    regular: lang === 'ko' ? '규칙적' : 'Regular',
    somewhat_irregular: lang === 'ko' ? '약간 불규칙' : 'Somewhat irregular',
    irregular: lang === 'ko' ? '불규칙' : 'Irregular',
    unknown: lang === 'ko' ? '데이터 부족' : 'Unknown',
  };

  // Pain stats from day logs
  const painLogs = dayLogs.filter((l) => l.painLevel != null);
  const avgPain = painLogs.length > 0
    ? (painLogs.reduce((s, l) => s + (l.painLevel ?? 0), 0) / painLogs.length).toFixed(1)
    : null;
  const maxPain = painLogs.length > 0
    ? Math.max(...painLogs.map((l) => l.painLevel ?? 0))
    : null;

  // Symptoms frequency
  const symCount: Record<string, number> = {};
  for (const log of dayLogs) {
    for (const sym of log.symptoms) {
      symCount[sym] = (symCount[sym] ?? 0) + 1;
    }
  }
  const topSymptoms = Object.entries(symCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Medication usage
  const medCount: Record<string, number> = {};
  for (const rec of intakeHistory) {
    medCount[rec.medicationId] = (medCount[rec.medicationId] ?? 0) + 1;
  }
  const topMeds = Object.entries(medCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const symLabel: Record<SymptomType, string> = {
    cramps: lang === 'ko' ? '복통/경련' : 'Cramps',
    bloating: lang === 'ko' ? '복부 팽만' : 'Bloating',
    headache: lang === 'ko' ? '두통' : 'Headache',
    backache: lang === 'ko' ? '요통' : 'Back pain',
    breast_tenderness: lang === 'ko' ? '유방 압통' : 'Breast tenderness',
    fatigue: lang === 'ko' ? '피로감' : 'Fatigue',
    nausea: lang === 'ko' ? '메스꺼움' : 'Nausea',
    mood_changes: lang === 'ko' ? '기분 변화' : 'Mood changes',
    acne: lang === 'ko' ? '여드름' : 'Acne',
  };

  const lines: string[] = [
    `${t.appt_header}`,
    `${t.appt_generated} — ${date}`,
    '',
    `${t.appt_cycles}`,
    `${t.appt_tracked}: ${stats.totalCycles}`,
    stats.averageCycleLength ? `${t.appt_avg_len}: ${stats.averageCycleLength} days` : '',
    stats.averagePeriodLength ? `${t.appt_avg_period}: ${stats.averagePeriodLength} days` : '',
    `${t.appt_regularity}: ${regularityLabels[stats.regularity]}${stats.cycleVariation !== null ? ` (±${stats.cycleVariation}d)` : ''}`,
  ];

  if (avgPain !== null) {
    lines.push('');
    lines.push(`${t.appt_pain}`);
    lines.push(`Average: ${avgPain}/10  Max: ${maxPain}/10  (n=${painLogs.length} days logged)`);
  }

  if (topSymptoms.length > 0) {
    lines.push('');
    lines.push(`${t.appt_symptoms}`);
    for (const [sym, count] of topSymptoms) {
      lines.push(`• ${symLabel[sym as SymptomType] ?? sym} (${count}x)`);
    }
  }

  if (topMeds.length > 0) {
    lines.push('');
    lines.push(`${t.appt_meds}`);
    for (const [medId, count] of topMeds) {
      const med = MEDICATIONS.find((m) => m.id === medId);
      lines.push(`• ${medId}${med ? '' : ''} — ${count} doses`);
    }
  }

  return lines.filter((l) => l !== '').join('\n');
}

export function SettingsPanel({ lang, onLanguageChange, onClearAll, cycles, stats, intakeHistory, dayLogs }: Props) {
  const t = translations[lang];
  const { mode, setMode } = useTheme();
  const [clearConfirm, setClearConfirm] = useState(false);
  const [exported, setExported] = useState(false);
  const [apptCopied, setApptCopied] = useState(false);
  const [showAppt, setShowAppt] = useState(false);

  const THEMES: { value: ThemeMode; label: string }[] = [
    { value: 'auto', label: t.settings_theme_auto },
    { value: 'light', label: t.settings_theme_light },
    { value: 'dark', label: t.settings_theme_dark },
  ];

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pehriod-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const handleClear = () => {
    clearAllStorage();
    onClearAll();
    setClearConfirm(false);
  };

  const summary = buildAppointmentSummary(t, cycles, stats, intakeHistory, dayLogs, lang);

  const handleCopyAppt = () => {
    navigator.clipboard.writeText(summary).then(() => {
      setApptCopied(true);
      setTimeout(() => setApptCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4">
      {/* Language */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">{t.settings_language}</h2>
        <div className="flex gap-2">
          {(Object.keys(languages) as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => onLanguageChange(l)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                lang === l
                  ? 'bg-pink-500 text-white border-pink-500'
                  : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              {languages[l].name}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">{t.settings_theme}</h2>
        <div className="flex gap-2">
          {THEMES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                mode === value
                  ? 'bg-pink-500 text-white border-pink-500'
                  : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-800">{t.settings_appt_summary}</h2>
          <button
            onClick={() => setShowAppt((v) => !v)}
            className="text-xs text-pink-600 underline"
          >
            {showAppt ? '▲' : '▼'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-2">{t.settings_appt_subtitle}</p>

        {showAppt && (
          <>
            {cycles.length < 2 ? (
              <p className="text-sm text-gray-400">{t.appt_no_data}</p>
            ) : (
              <>
                <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-mono leading-relaxed mb-3 max-h-64 overflow-y-auto">
                  {summary}
                </pre>
                <button
                  onClick={handleCopyAppt}
                  className="w-full py-2 border border-pink-200 text-pink-600 rounded-lg text-sm font-medium"
                >
                  {apptCopied ? `✓ ${t.settings_appt_copied}` : t.settings_appt_copy}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Data */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">{t.settings_data}</h2>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm text-left px-3"
          >
            {exported ? `✓ ${t.settings_export_done}` : `⬇ ${t.settings_export}`}
          </button>
          <button
            onClick={() => setClearConfirm(true)}
            className="w-full py-2.5 border border-red-200 text-red-600 rounded-lg text-sm text-left px-3"
          >
            🗑 {t.settings_clear}
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-1">{t.settings_about}</h2>
        <p className="text-xs text-gray-500 mb-1">{t.settings_about_text}</p>
        <p className="text-xs text-gray-400">{t.settings_version}</p>
      </div>

      {/* Clear confirm modal */}
      {clearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <p className="font-semibold text-gray-800 mb-2">{t.settings_clear}</p>
            <p className="text-sm text-gray-600 mb-4">{t.settings_clear_confirm}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setClearConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm"
              >
                {t.settings_clear_cancel}
              </button>
              <button
                onClick={handleClear}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium"
              >
                {t.settings_clear_yes}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
