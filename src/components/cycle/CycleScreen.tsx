'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { BleedEntry, CycleRecord, CycleStats, DayLog, FlowLevel } from '../../lib/types';
import { addDays, daysBetween, isoToDate, toISODate } from '../../lib/dates';
import { dayFlow, entriesBetween, entriesOn, summarize, PBAC_HEAVY } from '../../lib/pbac';
import { periodOn } from '../../lib/period';
import { sortCycles } from '../../lib/cycleCalculator';
import { CHARTABLE, TrackerId, Units, displayNumber, trackerDef } from '../../lib/trackers';
import { T, fmt, locale, Language } from '../../data/translations';
import { Button, Chip, Section, Seg, Sheet, cx } from '../ui/kit';
import { describeEntry } from '../today/BleedLogger';

interface Props {
  t: T;
  lang: Language;
  today: string;
  cycles: CycleRecord[];
  stats: CycleStats;
  bleeds: BleedEntry[];
  dayLogs: DayLog[];
  trackers: TrackerId[];
  units: Units;
  onSetFlow: (date: string, flow: FlowLevel | null) => void;
  onStartPeriod: (date: string) => void;
  onEndPeriod: (date: string) => void;
  onAddPast: (start: string, end: string, flow: FlowLevel) => void;
  onDeleteCycle: (id: string) => void;
  onSpotting: (date: string) => void;
  onRemoveBleed: (e: BleedEntry) => void;
}

const FLOWS: FlowLevel[] = ['spotting', 'light', 'medium', 'heavy'];
const DOTS: Record<FlowLevel, number> = { spotting: 0, light: 1, medium: 2, heavy: 3 };

export function CycleScreen(p: Props) {
  const { t, lang, today, cycles, stats, bleeds } = p;
  const [cursor, setCursor] = useState(() => today.slice(0, 7));
  const [day, setDay] = useState<string | null>(null);
  const [cycleSheet, setCycleSheet] = useState<CycleRecord | null>(null);
  const [addPast, setAddPast] = useState(false);
  const [pastStart, setPastStart] = useState('');
  const [pastEnd, setPastEnd] = useState('');
  const [pastFlow, setPastFlow] = useState<FlowLevel>('medium');

  const loc = locale(lang);
  const short = (iso: string) => isoToDate(iso).toLocaleDateString(loc, { month: 'short', day: 'numeric' });

  const flowOn = (date: string): FlowLevel | null => {
    const measured = dayFlow(entriesOn(bleeds, date));
    if (measured) return measured;
    for (const c of cycles) if (c.flowByDay[date]) return c.flowByDay[date];
    return null;
  };

  const predicted = useMemo(() => {
    const set = new Set<string>();
    const fertile = new Set<string>();
    const len = stats.averagePeriodLength ?? 5;
    for (const uc of stats.upcomingCycles) {
      for (let i = 0; i < len; i++) {
        const d = addDays(uc.periodStart, i);
        if (d > today) set.add(d);
      }
      for (let d = uc.fertileStart; d <= uc.fertileEnd; d = addDays(d, 1)) if (d >= today) fertile.add(d);
    }
    return { set, fertile };
  }, [stats, today]);

  const [y, m] = cursor.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const daysIn = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(first.getDay()).fill(null),
    ...Array.from({ length: daysIn }, (_, i) => toISODate(new Date(y, m - 1, i + 1))),
  ];
  while (cells.length % 7) cells.push(null);
  const shift = (n: number) => setCursor(toISODate(new Date(y, m - 1 + n, 1)).slice(0, 7));
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2026, 0, 4 + i).toLocaleDateString(loc, { weekday: 'narrow' }));

  // Average pain by period day, across completed periods.
  const painByDay = useMemo(() => {
    const byDate = new Map(p.dayLogs.filter((l) => l.painLevel != null).map((l) => [l.date, l.painLevel!]));
    const sums = Array.from({ length: 7 }, () => ({ s: 0, n: 0 }));
    for (const c of cycles) {
      for (let i = 0; i < 7; i++) {
        const d = addDays(c.startDate, i);
        if (c.endDate && d > c.endDate) break;
        const v = byDate.get(d);
        if (v != null) { sums[i].s += v; sums[i].n++; }
      }
    }
    return sums.map((x) => (x.n ? Math.round((x.s / x.n) * 10) / 10 : null));
  }, [cycles, p.dayLogs]);
  const hasPain = painByDay.some((v) => v !== null);

  const history = sortCycles(cycles).reverse();
  const dayCycle = day ? periodOn(cycles, day, today) : undefined;
  const ongoing = cycles.find((c) => !c.endDate);
  const dayEntries = day ? entriesOn(bleeds, day) : [];

  return (
    <div>
      <Section className="pt-2">
        <div className="flex items-center justify-between pb-3">
          <button onClick={() => shift(-1)} aria-label="‹" className="press flex h-11 w-11 items-center justify-center rounded-full bg-raise"><ChevronLeft size={20} className="rtl:rotate-180" /></button>
          <span className="casual text-lg font-bold">{first.toLocaleDateString(loc, { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => shift(1)} aria-label="›" className="press flex h-11 w-11 items-center justify-center rounded-full bg-raise"><ChevronRight size={20} className="rtl:rotate-180" /></button>
        </div>
        <div className="grid grid-cols-7 pb-1 text-center text-sm text-t3">
          {weekdays.map((w, i) => <div key={i}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const inPeriod = !!periodOn(cycles, d, today);
            const flow = flowOn(d);
            const isPred = !inPeriod && predicted.set.has(d);
            const isFertile = !inPeriod && predicted.fertile.has(d);
            return (
              <button
                key={d}
                onClick={() => setDay(d)}
                className="press relative mx-auto flex h-12 w-full max-w-12 flex-col items-center justify-center rounded-xl"
                style={{
                  background: inPeriod || flow ? 'color-mix(in srgb, var(--flow-medium) 20%, transparent)' : undefined,
                  boxShadow: isPred ? 'inset 0 0 0 1.5px color-mix(in srgb, var(--flow-medium) 60%, transparent)' : d === today ? 'inset 0 0 0 2px var(--accent)' : undefined,
                }}
              >
                <span className={cx('num text-[16px]', d === today && 'font-extrabold', d > today && !isPred && 'text-t2')}>{Number(d.slice(8))}</span>
                <span className="flex h-1.5 gap-0.5">
                  {flow && DOTS[flow] === 0 && <span className="h-1.5 w-1.5 rounded-full" style={{ boxShadow: 'inset 0 0 0 1.5px var(--flow-heavy)' }} />}
                  {flow && Array.from({ length: DOTS[flow] }, (_, k) => <span key={k} className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--flow-heavy)' }} />)}
                  {!flow && isFertile && <span className="h-1.5 w-1.5 rounded-full bg-good" />}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={t.stats}>
        <div className="grid grid-cols-3 gap-2">
          <Stat label={t.avg_cycle} value={stats.averageCycleLength} unit={t.d} />
          <Stat label={t.avg_period} value={stats.averagePeriodLength} unit={t.d} />
          <Stat label={t.variation} value={stats.cycleVariation} unit={t.d} prefix="±" />
        </div>
        {stats.nextPredictedStart && (
          <div className="mt-2 flex justify-between border-b border-line py-3">
            <span className="text-t2">{t.next_period}</span>
            <span className="num font-semibold">{short(stats.nextPredictedStart)}</span>
          </div>
        )}
        {stats.fertileWindowStart && stats.fertileWindowEnd && (
          <div className="flex justify-between border-b border-line py-3">
            <span className="text-t2">{t.fertile_window}</span>
            <span className="num">{short(stats.fertileWindowStart)} – {short(stats.fertileWindowEnd)}</span>
          </div>
        )}
      </Section>

      {hasPain && (
        <Section title={t.pain_by_day}>
          <div className="flex h-28 items-end gap-2">
            {painByDay.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="num text-xs text-t3">{v ?? ''}</span>
                <div className="w-full rounded-t-md" style={{ height: `${Math.max(((v ?? 0) / 10) * 72, 3)}px`, background: v !== null && v >= 7 ? 'var(--flow-heavy)' : 'var(--accent)', opacity: v === null ? 0.2 : 1 }} />
                <span className="num text-sm text-t3">{i + 1}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Trends t={t} lang={lang} trackers={p.trackers} dayLogs={p.dayLogs} units={p.units} today={today} />

      <Section title={t.periods} right={<button onClick={() => setAddPast(true)} className="press text-[15px] font-semibold text-accent">{t.add_past}</button>}>
        {history.length === 0 && <p className="text-t3">{t.no_periods}</p>}
        {history.map((c) => {
          const s = summarize(entriesBetween(bleeds, c.startDate, c.endDate ?? today));
          const len = c.endDate ? daysBetween(c.startDate, c.endDate) + 1 : null;
          return (
            <button key={c.id} onClick={() => setCycleSheet(c)} className="press flex w-full items-center gap-3 border-b border-line py-3 text-start">
              <span className="num flex-1">{short(c.startDate)}{c.endDate ? ` – ${short(c.endDate)}` : ''}</span>
              {len && <span className="num text-t3">{len}{t.d}</span>}
              {s.score > 0 && <span className={cx('num w-12 text-end font-semibold', s.score >= PBAC_HEAVY ? 'text-bad' : 'text-t2')}>{s.score}</span>}
            </button>
          );
        })}
      </Section>

      <Sheet open={!!day} onClose={() => setDay(null)}>
        {day && (
          <div>
            <h3 className="casual text-xl font-bold">{isoToDate(day).toLocaleDateString(loc, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            {dayCycle ? (
              <>
                <div className="mt-4 grid grid-cols-4 gap-1.5">
                  {FLOWS.map((f) => (
                    <Chip key={f} on={dayCycle.flowByDay[day] === f} onClick={() => p.onSetFlow(day, dayCycle.flowByDay[day] === f ? null : f)} className="px-1 text-[14px]">
                      {t[`flow_${f}`]}
                    </Chip>
                  ))}
                </div>
                {!dayCycle.endDate && day >= dayCycle.startDate && day <= today && (
                  <Button kind="quiet" className="mt-3 w-full" onClick={() => { p.onEndPeriod(day); setDay(null); }}>{t.ended_this_day}</Button>
                )}
              </>
            ) : (
              day <= today && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button kind="quiet" onClick={() => p.onSpotting(day)}>{t.spotting}</Button>
                  <Button disabled={!!ongoing} onClick={() => { p.onStartPeriod(day); setDay(null); }}>{t.started_this_day}</Button>
                </div>
              )
            )}
            {dayEntries.length > 0 && (
              <div className="mt-4">
                {dayEntries.sort((a, b) => a.ts - b.ts).map((e) => (
                  <div key={e.id} className="flex items-center gap-3 border-b border-line py-2">
                    <span className="num text-t3">{new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex-1">{describeEntry(t, e)}</span>
                    <button onClick={() => p.onRemoveBleed(e)} aria-label={t.delete} className="press flex h-10 w-10 items-center justify-center text-t3"><X size={18} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Sheet>

      <Sheet open={!!cycleSheet} onClose={() => setCycleSheet(null)}>
        {cycleSheet && (() => {
          const s = summarize(entriesBetween(bleeds, cycleSheet.startDate, cycleSheet.endDate ?? today));
          return (
            <div>
              <h3 className="num casual text-xl font-bold">{short(cycleSheet.startDate)}{cycleSheet.endDate ? ` – ${short(cycleSheet.endDate)}` : ''}</h3>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Stat label={t.score} value={s.score || null} />
                <Stat label="mL" value={s.ml || null} />
                <Stat label={t.clot_large} value={s.clotsLarge || null} />
              </div>
              <Button kind="danger" className="mt-6 w-full" onClick={() => { p.onDeleteCycle(cycleSheet.id); setCycleSheet(null); }}>{t.delete}</Button>
            </div>
          );
        })()}
      </Sheet>

      <Sheet open={addPast} onClose={() => setAddPast(false)}>
        <div>
          <h3 className="casual text-xl font-bold">{t.add_past}</h3>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <label className="text-sm text-t3">{t.start}<input type="date" max={today} value={pastStart} onChange={(e) => setPastStart(e.target.value)} className="field mt-1" /></label>
            <label className="text-sm text-t3">{t.end}<input type="date" max={today} min={pastStart} value={pastEnd} onChange={(e) => setPastEnd(e.target.value)} className="field mt-1" /></label>
          </div>
          <Seg className="mt-3" value={pastFlow} onChange={setPastFlow} options={FLOWS.map((f) => ({ value: f, label: t[`flow_${f}`] }))} />
          <Button
            className="mt-5 w-full"
            disabled={!pastStart || !pastEnd || pastEnd < pastStart}
            onClick={() => { p.onAddPast(pastStart, pastEnd, pastFlow); setAddPast(false); setPastStart(''); setPastEnd(''); }}
          >
            {t.add}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function Stat({ label, value, unit, prefix }: { label: string; value: number | null; unit?: string; prefix?: string }) {
  return (
    <div className="rounded-2xl bg-raise px-3 py-3">
      <div className="num text-3xl font-extrabold">{value === null ? '–' : `${prefix ?? ''}${value}`}<span className="text-base font-normal text-t3">{value === null ? '' : unit}</span></div>
      <div className="mt-0.5 text-sm text-t3">{label}</div>
    </div>
  );
}

function Trends({ t, trackers, dayLogs, units, today }: { t: T; lang: Language; trackers: TrackerId[]; dayLogs: DayLog[]; units: Units; today: string }) {
  const from = addDays(today, -90);
  const series = CHARTABLE.filter((id) => trackers.includes(id)).map((id) => {
    const def = trackerDef(id);
    const pts = dayLogs
      .filter((l) => l.date >= from && typeof l.values?.[id] === 'number')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => ({ x: daysBetween(from, l.date), y: displayNumber(def, l.values![id] as number, units) }));
    return { id, def, pts };
  }).filter((s) => s.pts.length >= 2);

  if (!series.length) return null;

  return (
    <Section title={fmt(t.last_n_days, { n: 90 })}>
      {series.map(({ id, def, pts }) => {
        const ys = pts.map((p) => p.y);
        const lo = Math.min(...ys);
        const hi = Math.max(...ys);
        const span = hi - lo || 1;
        const W = 200;
        const H = 40;
        const path = pts.map((p, i) => `${i ? 'L' : 'M'}${((p.x / 90) * W).toFixed(1)},${(H - ((p.y - lo) / span) * (H - 6) - 3).toFixed(1)}`).join(' ');
        const last = pts[pts.length - 1].y;
        const decimals = def.kind === 'number' ? def.decimals : 0;
        return (
          <div key={id} className="flex items-center gap-3 border-b border-line py-3">
            <span className="w-24 shrink-0 text-t2">{t[`tr_${id}`]}</span>
            <svg viewBox={`0 0 ${W} ${H}`} className="h-10 min-w-0 flex-1" preserveAspectRatio="none" aria-hidden>
              <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <span className="num w-20 shrink-0 text-end font-bold">
              {last.toFixed(decimals)}
              <span className="ms-0.5 text-sm font-normal text-t3">{def.kind === 'number' ? def.unit(units) : ''}</span>
            </span>
          </div>
        );
      })}
    </Section>
  );
}
