'use client';

import { useState } from 'react';
import { CycleRecord, CycleStats, FlowLevel } from '../../lib/types';
import { getPeriodDatesSet, todayISO, daysUntil, getDatesInRange } from '../../lib/cycleCalculator';
import { translations, Language } from '../../data/translations';

interface Props {
  cycles: CycleRecord[];
  stats: CycleStats;
  onStartPeriod: () => void;
  onEndPeriod: () => void;
  onLogFlow: (date: string, flow: FlowLevel) => void;
  onDeleteCycle: (id: string) => void;
  lang: Language;
}

const FLOWS: FlowLevel[] = ['spotting', 'light', 'medium', 'heavy'];

const flowColor: Record<FlowLevel, string> = {
  spotting: 'bg-pink-100',
  light: 'bg-pink-300',
  medium: 'bg-pink-500',
  heavy: 'bg-red-600',
};

function CalendarMonth({
  year, month, periodDates, predictedStart, onDayClick, cycles,
}: {
  year: number;
  month: number;
  periodDates: Set<string>;
  predictedStart: string | null;
  onDayClick: (date: string) => void;
  cycles: CycleRecord[];
}) {
  const today = todayISO();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = firstDay.getDay(); // 0=Sun

  // Predicted period range (avg period length ≈ 5 days)
  const predictedDates = new Set<string>();
  if (predictedStart) {
    const d = new Date(predictedStart + 'T00:00:00');
    for (let i = 0; i < 5; i++) {
      predictedDates.add(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() + 1);
    }
  }

  // Get flow for a date
  const getFlow = (date: string): FlowLevel | null => {
    for (const c of cycles) {
      if (c.flowByDay[date]) return c.flowByDay[date];
    }
    return null;
  };

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthStr = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-2 text-center">{monthStr}</p>
      <div className="grid grid-cols-7 gap-px text-center text-xs">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
          <div key={d} className="text-gray-400 font-medium pb-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = date === today;
          const isPeriod = periodDates.has(date);
          const isPredicted = !isPeriod && predictedDates.has(date) && date > today;
          const flow = getFlow(date);
          return (
            <button
              key={i}
              onClick={() => onDayClick(date)}
              className={`relative aspect-square flex items-center justify-center rounded-full text-xs transition-colors
                ${isToday ? 'ring-2 ring-pink-500' : ''}
                ${isPeriod && flow ? flowColor[flow] + ' text-white' : ''}
                ${isPeriod && !flow ? 'bg-pink-400 text-white' : ''}
                ${isPredicted ? 'bg-pink-100 text-pink-500' : ''}
                ${!isPeriod && !isPredicted ? 'text-gray-700 hover:bg-gray-100' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CycleTracker({ cycles, stats, onStartPeriod, onEndPeriod, onLogFlow, onDeleteCycle, lang }: Props) {
  const t = translations[lang];
  const today = todayISO();
  const [now] = useState(new Date());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const periodDates = getPeriodDatesSet(cycles);

  const handleDayClick = (date: string) => {
    setSelectedDay(date === selectedDay ? null : date);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const sortedCycles = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));

  const formatDate = (iso: string) => {
    return new Date(iso + 'T00:00:00').toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const getCycleLength = (c: CycleRecord): number | null => {
    if (!c.endDate) return null;
    const d = new Date(c.endDate + 'T00:00:00').getTime() - new Date(c.startDate + 'T00:00:00').getTime();
    return Math.round(d / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">{t.cycle_stats_title}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-pink-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">{t.cycle_avg_length}</p>
            <p className="text-xl font-bold text-pink-600">
              {stats.averageCycleLength ? `${stats.averageCycleLength}d` : '—'}
            </p>
          </div>
          <div className="bg-pink-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">{t.cycle_avg_period}</p>
            <p className="text-xl font-bold text-pink-600">
              {stats.averagePeriodLength ? `${stats.averagePeriodLength}d` : '—'}
            </p>
          </div>
          {stats.nextPredictedStart && (
            <div className="col-span-2 bg-pink-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">{t.cycle_next_predicted}</p>
              <p className="text-base font-bold text-pink-600">
                {formatDate(stats.nextPredictedStart)}
                {' '}
                <span className="text-sm font-normal text-gray-500">
                  ({daysUntil(stats.nextPredictedStart) === 0 ? t.today_next_period_today
                    : daysUntil(stats.nextPredictedStart) === 1 ? t.today_next_period_tomorrow
                    : daysUntil(stats.nextPredictedStart) < 0 ? t.today_overdue
                    : `${daysUntil(stats.nextPredictedStart)}${lang === 'ko' ? '일 후' : ' days'}`})
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Period start/end buttons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        {stats.isOnPeriod ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-red-600">🔴 {t.cycle_period_ongoing}</span>
              {stats.currentPeriodDay && (
                <p className="text-xs text-gray-500">{t.today_period_day}{stats.currentPeriodDay}</p>
              )}
            </div>
            <button
              onClick={onEndPeriod}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
            >
              {t.cycle_end_period}
            </button>
          </div>
        ) : (
          <button
            onClick={onStartPeriod}
            className="w-full py-3 bg-pink-500 text-white rounded-xl font-semibold text-base"
          >
            🌸 {t.cycle_start_period}
          </button>
        )}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-gray-700">‹</button>
          <span className="text-sm font-semibold text-gray-700">
            {new Date(calYear, calMonth, 1).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US', {
              month: 'long', year: 'numeric',
            })}
          </span>
          <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-gray-700">›</button>
        </div>
        <CalendarMonth
          year={calYear}
          month={calMonth}
          periodDates={periodDates}
          predictedStart={stats.nextPredictedStart}
          onDayClick={handleDayClick}
          cycles={cycles}
        />

        {/* Flow key */}
        <div className="flex gap-3 mt-3 text-xs text-gray-500 flex-wrap">
          {FLOWS.map((f) => (
            <div key={f} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${flowColor[f]}`} />
              <span>{t[`flow_${f}` as keyof typeof t]}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-pink-100" />
            <span>{lang === 'ko' ? '예상' : 'Predicted'}</span>
          </div>
        </div>
      </div>

      {/* Selected day flow log */}
      {selectedDay && (
        <div className="bg-white rounded-xl shadow-sm border border-pink-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {formatDate(selectedDay)} — {t.cycle_log_flow}
          </p>
          <div className="flex gap-2 flex-wrap">
            {FLOWS.map((f) => {
              const cycle = cycles.find((c) => {
                const end = c.endDate ?? todayISO();
                return c.startDate <= selectedDay && selectedDay <= end;
              });
              const active = cycle?.flowByDay[selectedDay] === f;
              return (
                <button
                  key={f}
                  onClick={() => onLogFlow(selectedDay, f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    active ? `${flowColor[f]} text-white border-transparent` : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : flowColor[f]}`} />
                  {t[`flow_${f}` as keyof typeof t]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setShowHistory((v) => !v)}
        >
          <h2 className="font-semibold text-gray-800">{t.cycle_history_title}</h2>
          <span className="text-gray-400">{showHistory ? '▲' : '▼'}</span>
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2">
            {sortedCycles.length === 0 ? (
              <p className="text-sm text-gray-400">{t.cycle_no_cycles}</p>
            ) : (
              sortedCycles.map((c) => {
                const len = getCycleLength(c);
                return (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm text-gray-700">
                        {formatDate(c.startDate)}
                        {c.endDate ? ` → ${formatDate(c.endDate)}` : ` (${t.cycle_period_ongoing})`}
                      </p>
                      {len && (
                        <p className="text-xs text-gray-400">{len} {t.cycle_days_long}</p>
                      )}
                    </div>
                    {deleteConfirm === c.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { onDeleteCycle(c.id); setDeleteConfirm(null); }}
                          className="text-xs text-red-600 font-medium"
                        >
                          {t.cycle_delete}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs text-gray-400"
                        >
                          {t.cycle_cancel}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(c.id)}
                        className="text-xs text-gray-300 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
