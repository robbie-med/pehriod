'use client';

import { useState } from 'react';
import { CycleRecord, CycleStats, FlowLevel, DayLog, CalendarEvent, CalendarEventType } from '../../lib/types';
import { getPeriodDatesSet, todayISO, daysUntil, addDays } from '../../lib/cycleCalculator';
import { translations, Language } from '../../data/translations';
import { CycleInsights } from '../features/CycleInsights';

interface Props {
  cycles: CycleRecord[];
  dayLogs: DayLog[];
  calendarEvents: CalendarEvent[];
  stats: CycleStats;
  onStartPeriod: () => void;
  onEndPeriod: () => void;
  onLogFlow: (date: string, flow: FlowLevel) => void;
  onDeleteCycle: (id: string) => void;
  onAddPastCycle: (start: string, end: string, flow: FlowLevel) => void;
  onLogCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeleteCalendarEvent: (id: string) => void;
  lang: Language;
}

const FLOWS: FlowLevel[] = ['spotting', 'light', 'medium', 'heavy'];

const flowColor: Record<FlowLevel, string> = {
  spotting: 'bg-pink-100 text-pink-700',
  light: 'bg-pink-300 text-white',
  medium: 'bg-pink-500 text-white',
  heavy: 'bg-red-600 text-white',
};

const flowDot: Record<FlowLevel, string> = {
  spotting: 'bg-pink-200',
  light: 'bg-pink-300',
  medium: 'bg-pink-500',
  heavy: 'bg-red-600',
};

const EVENT_TYPES: CalendarEventType[] = ['stress', 'travel', 'timezone', 'illness', 'exercise', 'other'];

export function CycleTracker({
  cycles, dayLogs, calendarEvents, stats, onStartPeriod, onEndPeriod, onLogFlow,
  onDeleteCycle, onAddPastCycle, onLogCalendarEvent, onDeleteCalendarEvent, lang,
}: Props) {
  const t = translations[lang];
  const today = todayISO();

  const [now] = useState(new Date());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddPast, setShowAddPast] = useState(false);
  const [pastStart, setPastStart] = useState('');
  const [pastEnd, setPastEnd] = useState('');
  const [pastFlow, setPastFlow] = useState<FlowLevel>('medium');
  const [addPastError, setAddPastError] = useState('');
  const [showEventLog, setShowEventLog] = useState(false);
  const [eventDate, setEventDate] = useState(today);
  const [eventType, setEventType] = useState<CalendarEventType>('stress');
  const [eventNotes, setEventNotes] = useState('');
  const [eventSaved, setEventSaved] = useState(false);

  const periodDates = getPeriodDatesSet(cycles);
  const eventDateSet = new Set(calendarEvents.map((e) => e.date));

  // Predicted/fertile date sets for calendar (all upcoming cycles within view year)
  const predictedDates = new Set<string>();
  const fertileDates = new Set<string>();
  const avgPeriodLen = stats.averagePeriodLength ?? 5;
  for (const uc of stats.upcomingCycles) {
    for (let i = 0; i < avgPeriodLen; i++) {
      const d = addDays(uc.periodStart, i);
      if (d > today) predictedDates.add(d);
    }
    let d = uc.fertileStart;
    while (d <= uc.fertileEnd) {
      if (d >= today) fertileDates.add(d);
      d = addDays(d, 1);
    }
  }

  const getFlowForDate = (date: string): FlowLevel | null => {
    for (const c of cycles) {
      if (c.flowByDay[date]) return c.flowByDay[date];
    }
    return null;
  };

  // Calendar render
  const firstDay = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startDow = firstDay.getDay();

  const calCells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calCells.length % 7 !== 0) calCells.push(null);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const formatDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  const getCycleLen = (c: CycleRecord) => {
    if (!c.endDate) return null;
    const ms = new Date(c.endDate + 'T00:00:00').getTime() - new Date(c.startDate + 'T00:00:00').getTime();
    return Math.round(ms / 86400000) + 1;
  };

  const handleAddPast = () => {
    setAddPastError('');
    if (!pastStart) { setAddPastError(lang === 'ko' ? '시작일을 입력하세요' : 'Enter a start date'); return; }
    if (!pastEnd) { setAddPastError(lang === 'ko' ? '종료일을 입력하세요' : 'Enter an end date'); return; }
    if (pastEnd < pastStart) { setAddPastError(lang === 'ko' ? '종료일이 시작일보다 이전입니다' : 'End date must be after start date'); return; }
    onAddPastCycle(pastStart, pastEnd, pastFlow);
    setPastStart('');
    setPastEnd('');
    setPastFlow('medium');
    setShowAddPast(false);
  };

  const handleLogEvent = () => {
    onLogCalendarEvent({ date: eventDate, type: eventType, notes: eventNotes || undefined });
    setEventNotes('');
    setEventSaved(true);
    setTimeout(() => setEventSaved(false), 1500);
  };

  const regularityLabel: Record<string, { label: string; color: string }> = {
    very_regular: { label: lang === 'ko' ? '매우 규칙적 ✓' : 'Very regular ✓', color: 'text-green-600' },
    regular: { label: lang === 'ko' ? '규칙적 ✓' : 'Regular ✓', color: 'text-green-500' },
    somewhat_irregular: { label: lang === 'ko' ? '약간 불규칙' : 'Somewhat irregular', color: 'text-yellow-600' },
    irregular: { label: lang === 'ko' ? '불규칙 ⚠' : 'Irregular ⚠', color: 'text-red-500' },
    unknown: { label: lang === 'ko' ? '데이터 부족' : 'Not enough data', color: 'text-gray-400' },
  };

  return (
    <div className="space-y-4">

      {/* Period start/end */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        {stats.isOnPeriod ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-red-600">🔴 {t.cycle_period_ongoing}</p>
              {stats.currentPeriodDay && (
                <p className="text-sm text-gray-500">{t.today_period_day}{stats.currentPeriodDay}</p>
              )}
            </div>
            <button
              onClick={onEndPeriod}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200"
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

      {/* Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">{t.cycle_stats_title}</h2>
        <div className="grid grid-cols-2 gap-2">
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

          {/* Regularity */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">{t.cycle_regularity}</p>
            <p className={`text-sm font-semibold mt-0.5 ${regularityLabel[stats.regularity].color}`}>
              {regularityLabel[stats.regularity].label}
            </p>
            {stats.cycleVariation !== null && (
              <p className="text-xs text-gray-400">±{stats.cycleVariation}d</p>
            )}
          </div>

          {/* Cycle count */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">{t.cycle_total_logged}</p>
            <p className="text-xl font-bold text-gray-700">{stats.totalCycles}</p>
          </div>
        </div>

        {/* Predictions */}
        {stats.nextPredictedStart && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t.cycle_next_predicted}</span>
              <span className="text-sm font-semibold text-pink-600">
                {formatDate(stats.nextPredictedStart)}
                {' '}
                <span className="font-normal text-gray-400 text-xs">
                  {daysUntil(stats.nextPredictedStart) < 0
                    ? `(${t.today_overdue})`
                    : daysUntil(stats.nextPredictedStart) === 0
                    ? `(${t.today_next_period_today})`
                    : `(${daysUntil(stats.nextPredictedStart)}${lang === 'ko' ? '일 후)' : 'd)'}`}
                </span>
              </span>
            </div>

            {stats.fertileWindowStart && stats.fertileWindowEnd && !stats.isOnPeriod && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  🌿 {t.cycle_fertile_window}
                  {stats.isFertileNow && (
                    <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                      {t.cycle_fertile_now}
                    </span>
                  )}
                </span>
                <span className="text-xs text-green-600 font-medium">
                  {formatDate(stats.fertileWindowStart)} – {formatDate(stats.fertileWindowEnd)}
                </span>
              </div>
            )}

            {stats.ovulationDay && !stats.isOnPeriod && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">🥚 {t.cycle_ovulation_est}</span>
                <span className="text-xs text-green-600 font-medium">{formatDate(stats.ovulationDay)}</span>
              </div>
            )}

            <p className="text-xs text-gray-400 italic">{t.cycle_prediction_note}</p>

            {/* Upcoming cycles list (year view) */}
            {stats.upcomingCycles.length > 1 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium mb-2">
                  {lang === 'ko' ? '향후 1년 예측' : lang === 'ar' ? 'توقعات لمدة سنة' : lang === 'my' ? 'တစ်နှစ် ခန့်မှန်းချက်' : 'Next 12 months'}
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {stats.upcomingCycles.slice(1).map((uc, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                      <span className="font-medium text-pink-600">{formatDate(uc.periodStart)}</span>
                      <span className="text-green-600 ml-2">🌿 {formatDate(uc.fertileStart)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Irregularity reassurance — shown when cycles are few or irregular */}
      {(stats.totalCycles < 6 || stats.regularity === 'irregular' || stats.regularity === 'somewhat_irregular' || stats.regularity === 'unknown') && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <p className="font-semibold text-blue-800 text-sm mb-1">ℹ️ {t.cycle_irregular_ok_title}</p>
          <p className="text-xs text-blue-700 leading-relaxed mb-2">{t.cycle_irregular_ok_body}</p>
          <p className="text-xs text-blue-500 italic">{t.cycle_irregular_ok_note}</p>
        </div>
      )}

      {/* Cycle insights */}
      <CycleInsights cycles={cycles} dayLogs={dayLogs} lang={lang} />

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 text-xl">‹</button>
          <span className="text-sm font-semibold text-gray-700">
            {new Date(calYear, calMonth, 1).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US', {
              month: 'long', year: 'numeric',
            })}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 text-xl">›</button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs mb-1">
          {(lang === 'ko'
            ? ['일','월','화','수','목','금','토']
            : ['Su','Mo','Tu','We','Th','Fr','Sa']
          ).map((d) => (
            <div key={d} className="text-gray-400 font-medium pb-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
          {calCells.map((day, i) => {
            if (!day) return <div key={i} />;
            const date = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = date === today;
            const isPeriod = periodDates.has(date);
            const isFertile = !isPeriod && fertileDates.has(date);
            const isPredicted = !isPeriod && !isFertile && predictedDates.has(date);
            const hasEvent = eventDateSet.has(date);
            const flow = getFlowForDate(date);
            const isSelected = selectedDay === date;

            let bgClass = '';
            let textClass = 'text-gray-700';
            if (isPeriod && flow) { bgClass = flowDot[flow]; textClass = flow === 'spotting' ? 'text-pink-700' : 'text-white'; }
            else if (isPeriod) { bgClass = 'bg-pink-400'; textClass = 'text-white'; }
            else if (isFertile) { bgClass = 'bg-green-100'; textClass = 'text-green-700'; }
            else if (isPredicted) { bgClass = 'bg-pink-50'; textClass = 'text-pink-400'; }

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(date === selectedDay ? null : date)}
                className={`aspect-square flex flex-col items-center justify-center rounded-full text-xs transition-colors relative
                  ${bgClass} ${textClass}
                  ${isToday ? 'ring-2 ring-pink-500 ring-offset-1' : ''}
                  ${isSelected ? 'ring-2 ring-gray-400 ring-offset-1' : ''}
                  ${!isPeriod && !isFertile && !isPredicted ? 'hover:bg-gray-100' : ''}
                `}
              >
                {day}
                {hasEvent && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-yellow-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-3 mt-3 text-xs text-gray-500 flex-wrap pt-2 border-t border-gray-50">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-pink-300" /><span>{t.flow_light}</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-600" /><span>{t.flow_heavy}</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-100 border border-green-300" /><span>{t.cycle_fertile_window}</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-pink-50 border border-pink-200" /><span>{lang === 'ko' ? '예상' : 'Predicted'}</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-400" /><span>{t.event_log_title}</span></div>
        </div>
      </div>

      {/* Calendar Event Logger */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-800">{t.event_log_title}</h2>
          <button
            onClick={() => setShowEventLog((v) => !v)}
            className="text-xs text-pink-600 border border-pink-200 rounded-full px-3 py-1"
          >
            {showEventLog ? '▲' : '+ Log'}
          </button>
        </div>

        {showEventLog && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">{t.event_log_date}</label>
              <input
                type="date"
                value={eventDate}
                max={today}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full mt-0.5 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-pink-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">{t.event_log_title}</label>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_TYPES.map((et) => (
                  <button
                    key={et}
                    onClick={() => setEventType(et)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      eventType === et
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {t[`event_${et}` as keyof typeof t] as string}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={eventNotes}
              onChange={(e) => setEventNotes(e.target.value)}
              placeholder={t.event_notes_placeholder as string}
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-pink-300"
            />
            <button
              onClick={handleLogEvent}
              className="w-full py-2 bg-pink-500 text-white rounded-lg text-sm font-medium"
            >
              {eventSaved ? `✓ ${t.event_logged}` : t.event_log_title}
            </button>
          </div>
        )}

        {/* Existing events */}
        {calendarEvents.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-400 mb-2">{t.event_existing}</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {[...calendarEvents]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{formatDate(ev.date)}</span>
                    <span className="text-gray-700 font-medium mx-2">
                      {t[`event_${ev.type}` as keyof typeof t] as string}
                    </span>
                    {ev.notes && <span className="text-gray-400 truncate max-w-24">{ev.notes}</span>}
                    <button
                      onClick={() => onDeleteCalendarEvent(ev.id)}
                      className="text-gray-300 hover:text-red-400 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected day flow log */}
      {selectedDay && periodDates.has(selectedDay) && (
        <div className="bg-white rounded-xl shadow-sm border border-pink-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {formatDate(selectedDay)} — {t.cycle_log_flow}
          </p>
          <div className="flex gap-2 flex-wrap">
            {FLOWS.map((f) => {
              const active = getFlowForDate(selectedDay) === f;
              return (
                <button
                  key={f}
                  onClick={() => onLogFlow(selectedDay, f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    active ? `${flowColor[f]} border-transparent` : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {t[`flow_${f}` as keyof typeof t]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* History + Add past cycle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <button
            className="flex items-center gap-2"
            onClick={() => setShowHistory((v) => !v)}
          >
            <span className="font-semibold text-gray-800">{t.cycle_history_title}</span>
            <span className="text-gray-400 text-sm">{showHistory ? '▲' : '▼'}</span>
          </button>
          <button
            onClick={() => setShowAddPast((v) => !v)}
            className="text-xs text-pink-600 border border-pink-200 rounded-full px-3 py-1"
          >
            + {t.cycle_add_past}
          </button>
        </div>

        {/* Add past cycle form */}
        {showAddPast && (
          <div className="mb-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
            <p className="text-sm font-medium text-gray-700 mb-2">{t.cycle_add_past_title}</p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500">{t.cycle_started}</label>
                <input
                  type="date"
                  value={pastStart}
                  max={today}
                  onChange={(e) => setPastStart(e.target.value)}
                  className="w-full mt-0.5 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-pink-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">{t.cycle_ended}</label>
                <input
                  type="date"
                  value={pastEnd}
                  max={today}
                  onChange={(e) => setPastEnd(e.target.value)}
                  className="w-full mt-0.5 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-pink-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">{t.cycle_flow_label}</label>
                <div className="flex gap-2 mt-1">
                  {FLOWS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setPastFlow(f)}
                      className={`flex-1 py-1 text-xs rounded-full border transition-colors ${
                        pastFlow === f ? `${flowColor[f]} border-transparent` : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {t[`flow_${f}` as keyof typeof t]}
                    </button>
                  ))}
                </div>
              </div>
              {addPastError && <p className="text-xs text-red-500">{addPastError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowAddPast(false); setAddPastError(''); }}
                  className="flex-1 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600"
                >
                  {t.cycle_cancel}
                </button>
                <button
                  onClick={handleAddPast}
                  className="flex-1 py-1.5 text-sm bg-pink-500 text-white rounded-lg font-medium"
                >
                  {t.cycle_confirm}
                </button>
              </div>
            </div>
          </div>
        )}

        {showHistory && (
          <div className="space-y-2 mt-2">
            {cycles.length === 0 ? (
              <p className="text-sm text-gray-400">{t.cycle_no_cycles}</p>
            ) : (
              [...cycles]
                .sort((a, b) => b.startDate.localeCompare(a.startDate))
                .map((c) => {
                  const len = getCycleLen(c);
                  return (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm text-gray-700">
                          {formatDate(c.startDate)}
                          {c.endDate
                            ? ` → ${formatDate(c.endDate)}`
                            : ` (${t.cycle_period_ongoing})`}
                        </p>
                        {len && <p className="text-xs text-gray-400">{len} {t.cycle_days_long}</p>}
                      </div>
                      {deleteConfirm === c.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { onDeleteCycle(c.id); setDeleteConfirm(null); }}
                            className="text-xs text-red-600 font-medium"
                          >
                            {t.cycle_delete}
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-400">
                            {t.cycle_cancel}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(c.id)} className="text-xs text-gray-300 hover:text-red-400 px-2">✕</button>
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
