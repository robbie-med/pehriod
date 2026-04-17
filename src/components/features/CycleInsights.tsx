'use client';

import { CycleRecord, DayLog } from '../../lib/types';
import { getDatesInRange } from '../../lib/cycleCalculator';
import { translations, Language } from '../../data/translations';

interface Props {
  cycles: CycleRecord[];
  dayLogs: DayLog[];
  lang: Language;
}

interface DayStats {
  day: number;
  avgPain: number | null;
  count: number;
}

function buildDayStats(cycles: CycleRecord[], dayLogs: DayLog[]): DayStats[] {
  const logsByDate: Record<string, DayLog> = {};
  for (const log of dayLogs) {
    logsByDate[log.date] = log;
  }

  const painByDay: Record<number, number[]> = {};

  for (const cycle of cycles) {
    if (!cycle.endDate) continue;
    const dates = getDatesInRange(cycle.startDate, cycle.endDate);
    dates.forEach((date, i) => {
      const dayNum = i + 1;
      if (dayNum > 10) return;
      const log = logsByDate[date];
      if (log?.painLevel != null) {
        if (!painByDay[dayNum]) painByDay[dayNum] = [];
        painByDay[dayNum].push(log.painLevel);
      }
    });
  }

  return Array.from({ length: 10 }, (_, i) => {
    const day = i + 1;
    const pains = painByDay[day] ?? [];
    return {
      day,
      avgPain: pains.length > 0 ? Math.round((pains.reduce((a, b) => a + b, 0) / pains.length) * 10) / 10 : null,
      count: pains.length,
    };
  });
}

export function CycleInsights({ cycles, dayLogs, lang }: Props) {
  const t = translations[lang];

  const completedCycles = cycles.filter((c) => c.endDate);
  if (completedCycles.length < 2 || dayLogs.length < 3) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-1">{t.insights_title}</h2>
        <p className="text-sm text-gray-400">{t.insights_no_data}</p>
      </div>
    );
  }

  const stats = buildDayStats(completedCycles, dayLogs);
  const hasData = stats.some((s) => s.avgPain !== null);

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-1">{t.insights_title}</h2>
        <p className="text-sm text-gray-400">{t.insights_no_data}</p>
      </div>
    );
  }

  const maxPain = Math.max(...stats.filter((s) => s.avgPain !== null).map((s) => s.avgPain!));
  const worstDay = stats.reduce((a, b) =>
    (a.avgPain ?? -1) > (b.avgPain ?? -1) ? a : b
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h2 className="font-semibold text-gray-800 mb-0.5">{t.insights_title}</h2>
      <p className="text-xs text-gray-400 mb-3">{t.insights_avg_pain}</p>

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-20 mb-2">
        {stats.map((s) => {
          const pct = s.avgPain !== null ? (s.avgPain / 10) : 0;
          const isWorst = s.day === worstDay.day && s.avgPain !== null;
          return (
            <div key={s.day} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full relative flex items-end" style={{ height: '64px' }}>
                {s.avgPain !== null ? (
                  <div
                    className={`w-full rounded-t transition-all ${isWorst ? 'bg-red-400' : 'bg-pink-300'}`}
                    style={{ height: `${Math.max(pct * 100, 8)}%` }}
                    title={`Day ${s.day}: ${s.avgPain}/10`}
                  />
                ) : (
                  <div className="w-full rounded-t bg-gray-100" style={{ height: '8%' }} />
                )}
              </div>
              <span className="text-xs text-gray-400">{s.day}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
          <span className="text-xs text-gray-600">
            {t.insights_worst_days}: {t.insights_day} {worstDay.day} ({worstDay.avgPain}/10)
          </span>
        </div>
      </div>
    </div>
  );
}
