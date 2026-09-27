'use client';

import { useState } from 'react';
import { DoseTotals, IntakeRecord, Medication, MedicationId, Relief, SafetyViolation } from '../../lib/types';
import { MEDICATIONS } from '../../lib/medications';
import { DOSE_LIMITS } from '../../lib/doseLimits';
import { checkSafety } from '../../lib/safetyChecker';
import { RELIEF_MIN_RATED, reliefStats } from '../../lib/relief';
import { isoOfTs, isoToDate } from '../../lib/dates';
import { T, fmt, locale, Language } from '../../data/translations';
import { Button, Chip, Section, Sheet, cx } from '../ui/kit';

interface Props {
  t: T;
  lang: Language;
  now: number;
  today: string;
  intakes: IntakeRecord[];
  doseTotals: DoseTotals;
  onTake: (id: MedicationId) => void;
  onDelete: (id: string) => void;
  onSetTime: (id: string, ts: number) => void;
  onRelief: (id: string, r: Relief | null | undefined) => void;
}

const TRACKED: { ing: keyof DoseTotals; max: number }[] = DOSE_LIMITS
  .filter((l) => l.isHardLimit || l.ingredient === 'caffeine')
  .map((l) => ({ ing: l.ingredient, max: l.maxDailyMg }));

export function duration(t: T, minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? fmt(t.dur_hm, { h, m }) : fmt(t.dur_m, { m });
}

function toLocalInput(ts: number) {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function composition(t: T, med: Medication): string {
  const mg = med.composition.map((c) => `${t[`ing_${c.ingredient}`]} ${c.amountMg}`).join(' + ') + ' mg';
  const c = med.composition[0];
  return med.tablets && med.tablets > 1 ? `${mg} · ${med.tablets}×${c.amountMg / med.tablets} mg` : mg;
}

export function violationText(t: T, v: SafetyViolation): string {
  const d = v.details ?? {};
  const ing = d.ingredient ? t[`ing_${d.ingredient}`] : '';
  const med = d.conflictingMed ? (t[MEDICATIONS.find((m) => m.id === d.conflictingMed)!.nameKey as keyof T] as string) : '';
  switch (v.type) {
    case 'daily-limit-exceeded': return fmt(t.v_limit, { ing, max: d.limitMg ?? '' });
    case 'approaching-limit': return fmt(t.v_near, { ing, max: d.limitMg ?? '' });
    case 'too-soon-since-last-dose': return fmt(t.v_soon, { time: duration(t, d.minutesUntilSafe ?? 0) });
    case 'conflicting-medications': return v.severity === 'error' ? fmt(t.v_conflict, { med }) : t.v_dual;
  }
}

export function MedsScreen({ t, lang, now, intakes, doseTotals, onTake, onDelete, onSetTime, onRelief }: Props) {
  const [override, setOverride] = useState<{ id: MedicationId; errors: SafetyViolation[] } | null>(null);
  const [editing, setEditing] = useState<IntakeRecord | null>(null);
  const [editTime, setEditTime] = useState('');
  const [showAll, setShowAll] = useState(false);

  const history = [...intakes].sort((a, b) => b.timestamp - a.timestamp);
  const visible = showAll ? history : history.slice(0, 12);
  const groups: { date: string; items: IntakeRecord[] }[] = [];
  for (const rec of visible) {
    const d = isoOfTs(rec.timestamp);
    const g = groups.find((x) => x.date === d);
    if (g) g.items.push(rec);
    else groups.push({ date: d, items: [rec] });
  }

  const openEdit = (rec: IntakeRecord) => {
    setEditing(rec);
    setEditTime(toLocalInput(rec.timestamp));
  };
  const current = editing ? intakes.find((i) => i.id === editing.id) : undefined;
  const time = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <Section className="pt-2">
        {MEDICATIONS.map((med) => {
          const violations = checkSafety(med.id, doseTotals, intakes, MEDICATIONS, DOSE_LIMITS);
          const errors = violations.filter((v) => v.severity === 'error');
          const warnings = violations.filter((v) => v.severity === 'warning');
          const wait = errors.find((v) => v.type === 'too-soon-since-last-dose')?.details?.minutesUntilSafe;
          const last = intakes.filter((i) => i.medicationId === med.id).sort((a, b) => b.timestamp - a.timestamp)[0];
          const r = reliefStats(intakes, [med.id]);
          const bits = [composition(t, med)];
          if (last) bits.push(fmt(t.ago, { time: duration(t, Math.round((now - last.timestamp) / 60000)) }));
          if (r.rated >= RELIEF_MIN_RATED) bits.push(fmt(t.helped_n, { n: r.helped, of: r.rated }));

          return (
            <div key={med.id} className="flex items-center gap-3 border-b border-line py-3">
              <div className="min-w-0 flex-1">
                <div className="text-[17px] font-semibold">{t[med.nameKey as keyof T] as string}</div>
                <div className="text-sm text-t3">{bits.join(' · ')}</div>
                {errors.length === 0 && warnings.map((w, i) => (
                  <div key={i} className="text-sm text-warn">{violationText(t, w)}</div>
                ))}
              </div>
              {errors.length === 0 ? (
                <Chip on onClick={() => onTake(med.id)} className="min-w-20">{t.take}</Chip>
              ) : (
                <Chip onClick={() => setOverride({ id: med.id, errors })} className="num min-w-20 text-t3">
                  {wait ? duration(t, wait) : t.blocked}
                </Chip>
              )}
            </div>
          );
        })}
      </Section>

      <Section title={t.last_24h}>
        {TRACKED.filter(({ ing }) => (doseTotals[ing] as number) > 0).map(({ ing, max }) => {
          const amt = doseTotals[ing] as number;
          const pct = Math.min(amt / max, 1);
          return (
            <div key={ing} className="py-2">
              <div className="flex justify-between text-[15px]">
                <span>{t[`ing_${ing as 'ibuprofen'}`]}</span>
                <span className="num text-t2">{amt} / {max} mg</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-raise">
                <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: pct >= 1 ? 'var(--bad)' : pct >= 0.66 ? 'var(--warn)' : 'var(--accent)' }} />
              </div>
            </div>
          );
        })}
        {TRACKED.every(({ ing }) => !(doseTotals[ing] as number)) && <p className="text-t3">{t.none_24h}</p>}
      </Section>

      {groups.length > 0 && (
        <Section title={t.history}>
          {groups.map((g) => (
            <div key={g.date}>
              <div className="pt-3 text-sm text-t3">
                {isoToDate(g.date).toLocaleDateString(locale(lang), { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              {g.items.map((rec) => {
                const med = MEDICATIONS.find((m) => m.id === rec.medicationId);
                return (
                  <button key={rec.id} onClick={() => openEdit(rec)} className="press flex w-full items-center gap-3 border-b border-line py-3 text-start">
                    <span className="flex-1">{med ? (t[med.nameKey as keyof T] as string) : rec.medicationId}</span>
                    {typeof rec.relief === 'number' && <span className="text-sm text-t3">{t[`relief_${rec.relief}`]}</span>}
                    <span className="num text-t2">{time(rec.timestamp)}</span>
                  </button>
                );
              })}
            </div>
          ))}
          {history.length > visible.length && (
            <button onClick={() => setShowAll(true)} className="press mt-3 text-[15px] font-semibold text-accent">{t.show_all}</button>
          )}
        </Section>
      )}

      <Sheet open={!!override} onClose={() => setOverride(null)}>
        {override && (
          <div>
            <h3 className="text-xl font-bold">{t[MEDICATIONS.find((m) => m.id === override.id)!.nameKey as keyof T] as string}</h3>
            <div className="mt-3 space-y-1">
              {override.errors.map((v, i) => <p key={i} className="text-[17px] text-bad">{violationText(t, v)}</p>)}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button kind="quiet" onClick={() => setOverride(null)}>{t.cancel}</Button>
              <Button kind="danger" onClick={() => { onTake(override.id); setOverride(null); }}>{t.log_anyway}</Button>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={!!current} onClose={() => setEditing(null)}>
        {current && (
          <div>
            <h3 className="text-xl font-bold">{t[MEDICATIONS.find((m) => m.id === current.medicationId)?.nameKey as keyof T] as string}</h3>
            <label className="mt-4 block text-sm text-t3">{t.time}</label>
            <input
              type="datetime-local"
              value={editTime}
              max={toLocalInput(now)}
              onChange={(e) => setEditTime(e.target.value)}
              onBlur={() => editTime && onSetTime(current.id, new Date(editTime).getTime())}
              className="field mt-1"
            />
            <div className="mt-4 text-sm text-t3">{t.relief_q}</div>
            <div className="mt-1 grid grid-cols-5 gap-1.5">
              {([0, 1, 2, 3, 4] as Relief[]).map((r) => (
                <button
                  key={r}
                  onClick={() => onRelief(current.id, current.relief === r ? undefined : r)}
                  className={cx('press h-12 rounded-xl text-[13px] leading-tight', current.relief === r ? 'bg-accent text-on-accent font-semibold' : 'bg-raise text-t2')}
                >
                  {t[`relief_${r}`]}
                </button>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button kind="quiet" onClick={() => { onDelete(current.id); setEditing(null); }}>{t.delete}</Button>
              <Button onClick={() => { if (editTime) onSetTime(current.id, new Date(editTime).getTime()); setEditing(null); }}>{t.done}</Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
