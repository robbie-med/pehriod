'use client';

import { Minus, Plus } from 'lucide-react';
import { TrackerValue } from '../../lib/types';
import { TrackerDef, Units, displayNumber, displayStep, storeNumber } from '../../lib/trackers';
import { T } from '../../data/translations';
import { Chip, cx } from '../ui/kit';

interface Props {
  t: T;
  def: TrackerDef;
  value: TrackerValue | undefined;
  /** Most recent earlier value, used as the starting point for steppers. */
  previous: TrackerValue | undefined;
  units: Units;
  onChange: (v: TrackerValue | undefined) => void;
}

export function TrackerRow({ t, def, value, previous, units, onChange }: Props) {
  const label = t[`tr_${def.id}`];

  if (def.kind === 'toggle') {
    return (
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-line py-2">
        <span>{label}</span>
        <Chip on={value === true} onClick={() => onChange(value === true ? undefined : true)}>
          {value === true ? t.yes : t.no}
        </Chip>
      </div>
    );
  }

  if (def.kind === 'scale' || def.kind === 'choice') {
    const opts = def.kind === 'scale'
      ? Array.from({ length: def.max }, (_, i) => ({ v: i + 1 as TrackerValue, label: String(i + 1) }))
      : def.options.map((o) => ({ v: o as TrackerValue, label: t[`tr_${def.id}_${o}` as keyof T] as string }));
    return (
      <div className="border-b border-line py-2.5">
        <div className="mb-2">{label}</div>
        <div className={cx('flex gap-1.5', def.kind === 'choice' && 'flex-wrap')}>
          {opts.map((o) => (
            <Chip key={String(o.v)} on={value === o.v} onClick={() => onChange(value === o.v ? undefined : o.v)} className={def.kind === 'scale' ? 'flex-1 px-0 num' : ''}>
              {o.label}
            </Chip>
          ))}
        </div>
      </div>
    );
  }

  const step = displayStep(def, units);
  const base = typeof value === 'number' ? value : typeof previous === 'number' ? previous : def.start;
  const shown = displayNumber(def, base, units);
  const set = (d: number) => {
    const next = Math.round((shown + d) / step) * step;
    const stored = storeNumber(def, next, units);
    onChange(Math.min(def.max, Math.max(def.min, Math.round(stored * 1000) / 1000)));
  };
  const isSet = typeof value === 'number';

  return (
    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-line py-2">
      <span>{label}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => set(-step)} aria-label="−" className="press flex h-10 w-10 items-center justify-center rounded-full bg-raise text-t2">
          <Minus size={18} />
        </button>
        <button
          onClick={() => (isSet ? onChange(undefined) : onChange(base))}
          className={cx('press num min-w-20 px-1 text-center text-xl font-bold', isSet ? 'text-t1' : 'text-t3')}
        >
          {shown.toFixed(def.decimals)}
          <span className="ms-1 text-sm font-normal text-t3">{def.unit(units)}</span>
        </button>
        <button onClick={() => set(step)} aria-label="+" className="press flex h-10 w-10 items-center justify-center rounded-full bg-raise text-t2">
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
