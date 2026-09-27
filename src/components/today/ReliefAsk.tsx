'use client';

import { X } from 'lucide-react';
import { IntakeRecord, Relief } from '../../lib/types';
import { MEDICATIONS } from '../../lib/medications';
import { T } from '../../data/translations';

const LEVELS: Relief[] = [0, 1, 2, 3, 4];

export function ReliefAsk({ t, intake, onRate }: {
  t: T;
  intake: IntakeRecord;
  onRate: (r: Relief | null) => void;
}) {
  const med = MEDICATIONS.find((m) => m.id === intake.medicationId);
  const time = new Date(intake.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="border-b border-line py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[17px]">
          <span className="font-semibold">{med ? (t[med.nameKey as keyof T] as string) : ''}</span>
          <span className="num text-t3"> · {time}</span>
          <span className="text-t2"> · {t.relief_q}</span>
        </p>
        <button onClick={() => onRate(null)} aria-label={t.skip} className="press -me-2 flex h-10 w-10 items-center justify-center text-t3">
          <X size={18} />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {LEVELS.map((r) => (
          <button
            key={r}
            onClick={() => onRate(r)}
            className="press flex h-14 flex-col items-center justify-center rounded-xl bg-raise px-1 text-center text-[13px] leading-tight"
          >
            <span className="num text-base font-bold" style={{ color: r >= 3 ? 'var(--good)' : r <= 1 ? 'var(--bad)' : 'var(--t2)' }}>{r}</span>
            <span className="text-t2">{t[`relief_${r}`]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
