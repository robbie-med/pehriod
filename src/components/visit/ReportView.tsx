'use client';

import { Printer, X } from 'lucide-react';
import { ReportData } from '../../lib/report';
import { Evidence } from '../../lib/evidence';
import { ALL_QUESTIONS, Answer, Answers, ESTROGEN_ITEMS, Question, VISIT, isAnswered } from '../../lib/visit';
import { MEDICATIONS } from '../../lib/medications';
import { isoToDate } from '../../lib/dates';
import { T, Language, fmt, languages, locale, tk } from '../../data/translations';
import { cx } from '../ui/kit';

interface Props {
  t: T;
  td: T;
  lang: Language;
  doctorLang: Language;
  report: ReportData;
  evidence: Record<string, Evidence>;
  answers: Answers;
  onClose: () => void;
}

const LB_PER_KG = 2.20462;

export function ReportView({ t, td, lang, doctorLang, report, evidence, answers, onClose }: Props) {
  const dloc = locale(doctorLang);
  const bilingual = lang !== doctorLang;
  const date = (iso: string) => isoToDate(iso).toLocaleDateString(dloc, { year: 'numeric', month: 'short', day: 'numeric' });
  const short = (iso: string) => isoToDate(iso).toLocaleDateString(dloc, { month: 'short', day: 'numeric' });

  /** Label in the doctor's language, with the patient's language underneath when they differ. */
  const lbl = (k: string, clinical?: string) => (
    <span>
      <span className="font-semibold">{tk(td, clinical ?? k)}</span>
      {bilingual && <span className="block text-[12px] leading-tight text-t3">{tk(t, k)}</span>}
    </span>
  );

  const birthYear = typeof answers.birth_year === 'number' ? answers.birth_year : null;
  const age = birthYear ? Number(report.today.slice(0, 4)) - birthYear : null;

  const answerText = (q: Question, a: Answer | undefined): string => {
    if (a === undefined) return '—';
    if (a === 'unsure') return td.unsure;
    if (q.kind === 'yn' || q.kind === 'yn3') return a === 'yes' ? td.yes : td.no;
    if (q.kind === 'choice') return tk(td, `opt_${q.id}_${a}`);
    if (q.kind === 'multi' && Array.isArray(a)) return a.map((o) => tk(td, `opt_${q.id}_${o}`)).join(', ');
    if (q.kind === 'date' && typeof a === 'string') return date(a);
    if (q.kind === 'number' && typeof a === 'number') {
      if (q.unit === 'weight') return `${a} kg · ${Math.round(a * LB_PER_KG)} lb`;
      if (q.unit === 'height') {
        const inches = Math.round(a / 2.54);
        return `${a} cm · ${Math.floor(inches / 12)}′${inches % 12}″`;
      }
      if (q.unit === 'days') return `${a} ${td.days}`;
      if (q.unit === 'score') return `${a}/10`;
      return String(a);
    }
    return String(a);
  };

  const evidenceText = (e: Evidence): string => {
    const l = e.logged;
    switch (l.kind) {
      case 'date': return date(l.value);
      case 'days': return fmt(td.ev_median_days, { v: l.value, n: l.n });
      case 'range': return fmt(td.ev_spread, { v: l.value, n: l.n });
      case 'score': return fmt(td.ev_peak, { v: l.value });
      case 'relief': return fmt(td.ev_relief, { h: l.helped, r: l.rated });
      case 'weight': return `${Math.round(l.value * 10) / 10} kg`;
      case 'minutes': return `${l.value} min`;
      case 'count': return fmt(tk(td, `ev_${e.what}`), { v: l.value, of: l.of ?? '' });
    }
  };

  const estrogenYes = ESTROGEN_ITEMS.filter((id) => answers[id] === 'yes' || answers[id] === 'unsure');
  const smokes = answers.smoke === 'under15' || answers.smoke === 'over15';
  const anyAnswers = ALL_QUESTIONS.some((q) => isAnswered(answers[q.id]));
  const reasons = Array.isArray(answers.reasons) ? answers.reasons : [];
  const goals = Array.isArray(answers.goals) ? answers.goals : [];

  const flagText: Record<ReportData['flags'][number], string> = {
    heavy: fmt(td.flag_heavy, { n: report.heavy, of: report.withBleeds }),
    nsaid: fmt(td.flag_nsaid, { n: report.nsaid.poor, of: report.nsaid.rated, c: report.nsaid.cycles }),
    frequent: fmt(td.flag_frequent, { v: report.medianLength ?? '' }),
    infrequent: fmt(td.flag_infrequent, { v: report.medianLength ?? '' }),
    irregular: fmt(td.flag_irregular, { v: report.variation ?? '' }),
    prolonged: fmt(td.flag_prolonged, { n: report.prolonged, of: report.withDuration }),
    flooding: fmt(td.flag_flooding, { n: report.floods }),
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-bg" dir={languages[doctorLang].dir} lang={doctorLang}>
      <div className="no-print sticky top-0 z-10 flex items-center justify-end gap-2 bg-bg px-4 py-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <button onClick={() => window.print()} className="press flex h-11 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-on-accent">
          <Printer size={18} />{t.print}
        </button>
        <button onClick={onClose} aria-label={t.close} className="press flex h-11 w-11 items-center justify-center rounded-full bg-raise"><X size={20} /></button>
      </div>

      <article className="mx-auto max-w-3xl px-4 pb-16 text-[14px] leading-snug">
        <header className="border-b-2 border-t1 pb-3">
          <h1 className="casual text-2xl font-extrabold">{td.report_title}</h1>
          <p className="text-t2">
            {date(report.today)}
            {age !== null && ` · ${fmt(td.age_n, { n: age })}`}
            {` · ${td.patient_language}: ${languages[lang].name}`}
          </p>
        </header>

        {report.flags.length > 0 && (
          <Block title={td.r_flags}>
            <ul className="space-y-1">
              {report.flags.map((f) => <li key={f} className="font-semibold">▸ {flagText[f]}</li>)}
            </ul>
          </Block>
        )}

        {(reasons.length > 0 || goals.length > 0) && (
          <Block title={td.r_visit}>
            {reasons.length > 0 && <Line label={lbl('q_reasons', 'd_reasons')} value={answerText(ALL_QUESTIONS.find((q) => q.id === 'reasons')!, reasons)} />}
            {goals.length > 0 && <Line label={lbl('q_goals', 'd_goals')} value={answerText(ALL_QUESTIONS.find((q) => q.id === 'goals')!, goals)} />}
          </Block>
        )}

        {(estrogenYes.length > 0 || smokes) && (
          <Block title={td.r_estrogen}>
            {smokes && <Line label={lbl('q_smoke', 'd_smoke')} value={`${answerText(ALL_QUESTIONS.find((q) => q.id === 'smoke')!, answers.smoke)}${age !== null && age >= 35 ? ` · ${fmt(td.age_n, { n: age })}` : ''}`} strong />}
            {estrogenYes.map((id) => {
              const q = ALL_QUESTIONS.find((x) => x.id === id)!;
              return <Line key={id} label={lbl(`q_${id}`, `d_${id}`)} value={answerText(q, answers[id])} strong />;
            })}
          </Block>
        )}

        {report.cycles.length > 0 && (
          <Block title={td.r_cycles}>
            <div className="overflow-x-auto">
              <table className="w-full text-end text-[13px] [&_td]:px-1 [&_th]:px-1 [&_th]:align-bottom">
                <thead className="text-t3">
                  <tr className="border-b border-line">
                    <th className="py-1 text-start font-normal">{td.c_start}</th>
                    <th className="font-normal">{td.c_cycle}</th>
                    <th className="font-normal">{td.c_bleed}</th>
                    <th className="font-normal">PBAC</th>
                    <th className="font-normal">mL</th>
                    <th className="font-normal">{td.c_clots}</th>
                    <th className="font-normal">{td.c_pain}</th>
                    <th className="font-normal">{td.c_missed}</th>
                  </tr>
                </thead>
                <tbody className="num">
                  {report.cycles.map((c) => (
                    <tr key={c.start} className="border-b border-line">
                      <td className="py-1.5 text-start">{short(c.start)}</td>
                      <td className={cx(c.length !== null && (c.length < 24 || c.length > 38) && 'font-bold')}>{c.length ?? '–'}</td>
                      <td className={cx(c.duration !== null && c.duration > 8 && 'font-bold')}>{c.duration ?? '–'}</td>
                      <td className={cx(c.score >= 100 && 'font-bold')}>{c.logged ? c.score : '–'}</td>
                      <td className={cx(c.ml >= 80 && 'font-bold')}>{c.ml || '–'}</td>
                      <td>{c.clotsLarge || '–'}</td>
                      <td>{c.peakPain ?? '–'}</td>
                      <td>{c.missed || '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 space-y-0.5 text-t2">
              {report.medianLength !== null && <p>{fmt(td.r_median_cycle, { v: report.medianLength })}{report.variation !== null && ` · ${fmt(td.r_spread, { v: report.variation })}`}</p>}
              <p className="text-[12px] text-t3">{td.r_figo_note}</p>
            </div>
          </Block>
        )}

        {(report.relief.length > 0 || report.nsaidDays.some((m) => m.days > 0)) && (
          <Block title={td.r_analgesia}>
            <Line label={td.r_nsaid_days} value={report.nsaidDays.map((m) => `${isoToDate(`${m.month}-01`).toLocaleDateString(dloc, { month: 'short' })} ${m.days}${td.d}`).join(' · ')} />
            {report.relief.map((r) => {
              const med = MEDICATIONS.find((m) => m.id === r.medId)!;
              return <Line key={r.medId} label={tk(td, med.nameKey)} value={fmt(td.ev_relief, { h: r.helped, r: r.rated })} />;
            })}
            {report.early.ready && (
              <Line
                label={td.r_early}
                value={fmt(td.r_early_value, { a: report.early.early.peak ?? '', na: report.early.early.n, b: report.early.onset.peak ?? '', nb: report.early.onset.n })}
              />
            )}
          </Block>
        )}

        {anyAnswers && VISIT.filter((s) => s.id !== 'why').map((s) => {
          const rows = s.questions.filter((q) => isAnswered(answers[q.id]) || evidence[q.id]);
          if (!rows.length) return null;
          return (
            <Block key={s.id} title={tk(td, `sec_${s.id}`)}>
              {rows.map((q) => {
                const ev = evidence[q.id];
                return (
                  <div key={q.id} className="grid grid-cols-[1fr_auto] items-start gap-x-3 border-b border-line py-1.5">
                    {lbl(`q_${q.id}`, `d_${q.id}`)}
                    <div className="text-end">
                      <div className={cx(answers[q.id] === 'yes' && 'font-bold')}>{answerText(q, answers[q.id])}</div>
                      {ev && (
                        <div className={cx('text-[12px]', ev.mismatch ? 'font-bold text-bad' : 'text-t3')}>
                          {ev.mismatch ? '≠ ' : ''}{td.logged}: {evidenceText(ev)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </Block>
          );
        })}

        <p className="mt-8 text-[12px] text-t3">{td.r_footer}</p>
      </article>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h2 className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-t3">{title}</h2>
      {children}
    </section>
  );
}

function Line({ label, value, strong }: { label: React.ReactNode; value: string; strong?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-x-3 border-b border-line py-1.5">
      <div>{label}</div>
      <div className={cx('num text-end', strong && 'font-bold')}>{value}</div>
    </div>
  );
}
