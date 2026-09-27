'use client';

import { useState } from 'react';
import { ALL_QUESTIONS, Answer, Answers, Question, VISIT, isAnswered } from '../../lib/visit';
import { Units } from '../../lib/trackers';
import { T, Language, languages, tk } from '../../data/translations';
import { Button, Chip, Section, Seg } from '../ui/kit';

interface Props {
  t: T;
  answers: Answers;
  units: Units;
  doctorLang: Language;
  onDoctorLang: (l: Language) => void;
  onAnswer: (id: string, a: Answer | undefined) => void;
  onClear: () => void;
  onOpenReport: () => void;
}

const IN_PER_CM = 1 / 2.54;
const LB_PER_KG = 2.20462;

function toShown(q: Question, v: number, units: Units): number {
  if (units === 'imperial' && q.unit === 'height') return Math.round(v * IN_PER_CM);
  if (units === 'imperial' && q.unit === 'weight') return Math.round(v * LB_PER_KG);
  return v;
}
function toStored(q: Question, v: number, units: Units): number {
  if (units === 'imperial' && q.unit === 'height') return Math.round(v / IN_PER_CM);
  if (units === 'imperial' && q.unit === 'weight') return Math.round((v / LB_PER_KG) * 10) / 10;
  return v;
}
export function unitLabel(t: T, q: Question, units: Units): string {
  switch (q.unit) {
    case 'days': return t.days;
    case 'years': return t.years_old;
    case 'height': return units === 'imperial' ? 'in' : 'cm';
    case 'weight': return units === 'imperial' ? 'lb' : 'kg';
    case 'score': return '/ 10';
    default: return '';
  }
}

function NumberInput({ q, value, units, t, onAnswer }: { q: Question; value: Answer | undefined; units: Units; t: T; onAnswer: Props['onAnswer'] }) {
  const [text, setText] = useState(typeof value === 'number' ? String(toShown(q, value, units)) : '');
  const commit = () => {
    const n = Number(text.replace(',', '.'));
    if (text.trim() === '' || Number.isNaN(n)) {
      if (value !== 'unsure') onAnswer(q.id, undefined);
      return;
    }
    onAnswer(q.id, toStored(q, n, units));
  };
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          inputMode={q.unit === 'height' || q.unit === 'weight' ? 'decimal' : 'numeric'}
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^\d.,]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="field num pe-16 text-lg font-bold"
        />
        <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-t3">{unitLabel(t, q, units)}</span>
      </div>
      <Chip on={value === 'unsure'} onClick={() => { setText(''); onAnswer(q.id, value === 'unsure' ? undefined : 'unsure'); }}>{t.unsure}</Chip>
    </div>
  );
}

function TextInput({ id, value, onAnswer }: { id: string; value: Answer | undefined; onAnswer: Props['onAnswer'] }) {
  const [text, setText] = useState(typeof value === 'string' ? value : '');
  return (
    <textarea
      value={text}
      rows={2}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onAnswer(id, text.trim() || undefined)}
      className="field resize-none"
    />
  );
}

function Control({ q, value, t, units, onAnswer }: { q: Question; value: Answer | undefined; t: T; units: Units; onAnswer: Props['onAnswer'] }) {
  const pick = (v: string) => onAnswer(q.id, value === v ? undefined : v);
  switch (q.kind) {
    case 'yn':
    case 'yn3':
      return (
        <div className="flex gap-1.5">
          <Chip on={value === 'yes'} onClick={() => pick('yes')} className="flex-1">{t.yes}</Chip>
          <Chip on={value === 'no'} onClick={() => pick('no')} className="flex-1">{t.no}</Chip>
          {q.kind === 'yn3' && <Chip on={value === 'unsure'} onClick={() => pick('unsure')} className="flex-1">{t.unsure}</Chip>}
        </div>
      );
    case 'choice':
      return (
        <div className="flex flex-wrap gap-1.5">
          {q.options!.map((o) => <Chip key={o} on={value === o} onClick={() => pick(o)}>{tk(t, `opt_${q.id}_${o}`)}</Chip>)}
        </div>
      );
    case 'multi': {
      const list = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {q.options!.map((o) => (
            <Chip key={o} on={list.includes(o)} onClick={() => onAnswer(q.id, list.includes(o) ? list.filter((x) => x !== o) : [...list, o])}>
              {tk(t, `opt_${q.id}_${o}`)}
            </Chip>
          ))}
        </div>
      );
    }
    case 'number':
      return <NumberInput q={q} value={value} units={units} t={t} onAnswer={onAnswer} />;
    case 'date':
      return (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={typeof value === 'string' && value !== 'unsure' ? value : ''}
            onChange={(e) => onAnswer(q.id, e.target.value || undefined)}
            className="field flex-1"
          />
          <Chip on={value === 'unsure'} onClick={() => pick('unsure')}>{t.unsure}</Chip>
        </div>
      );
    case 'text':
      return <TextInput id={q.id} value={value} onAnswer={onAnswer} />;
  }
}

export function VisitScreen({ t, answers, units, doctorLang, onDoctorLang, onAnswer, onClear, onOpenReport }: Props) {
  const done = ALL_QUESTIONS.filter((q) => isAnswered(answers[q.id])).length;
  const [confirmClear, setConfirmClear] = useState(false);
  const [version, setVersion] = useState(0);

  return (
    <div>
      <div className="pt-2">
        <p className="text-[17px] text-t2">{t.visit_intro}</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-raise">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(done / ALL_QUESTIONS.length) * 100}%` }} />
          </div>
          <span className="num text-sm text-t3">{done}/{ALL_QUESTIONS.length}</span>
        </div>
        <div className="mt-4 text-sm text-t3">{t.doctor_language}</div>
        <Seg
          className="mt-1"
          value={doctorLang}
          onChange={onDoctorLang}
          options={(Object.keys(languages) as Language[]).map((l) => ({ value: l, label: languages[l].name }))}
        />
        <Button className="mt-3 w-full" onClick={onOpenReport}>{t.open_report}</Button>
      </div>

      {VISIT.map((s) => (
        <Section key={`${s.id}-${version}`} title={tk(t, `sec_${s.id}`)}>
          {s.questions.map((q) => (
            <div key={q.id} className="border-b border-line py-4">
              <p className="mb-2.5 text-[17px] leading-snug">{tk(t, `q_${q.id}`)}</p>
              <Control q={q} value={answers[q.id]} t={t} units={units} onAnswer={onAnswer} />
            </div>
          ))}
        </Section>
      ))}

      <div className="pt-8">
        {confirmClear ? (
          <div className="grid grid-cols-2 gap-2">
            <Button kind="quiet" onClick={() => setConfirmClear(false)}>{t.cancel}</Button>
            <Button kind="danger" onClick={() => { onClear(); setConfirmClear(false); setVersion((v) => v + 1); }}>{t.clear_answers}</Button>
          </div>
        ) : (
          <Button kind="quiet" className="w-full" onClick={() => setConfirmClear(true)}>{t.clear_answers}</Button>
        )}
      </div>
    </div>
  );
}
