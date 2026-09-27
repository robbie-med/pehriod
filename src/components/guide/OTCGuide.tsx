'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { T } from '../../data/translations';
import { cx } from '../ui/kit';

function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button className="press flex min-h-14 w-full items-center justify-between gap-3 py-3 text-start" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="casual text-[18px] font-bold">{title}</span>
        <ChevronDown size={20} className={cx('shrink-0 text-t3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="space-y-4 pb-5 text-[16px] leading-relaxed text-t2">{children}</div>}
    </div>
  );
}

function Drug({ name, dose, interval, max, tip }: { name: string; dose: string; interval: string; max: string; tip: string }) {
  return (
    <div>
      <p className="font-semibold text-t1">{name}</p>
      <div className="mt-1 space-y-0.5 text-[15px]">
        <p>{dose}</p>
        <p>{interval}</p>
        <p className="font-semibold text-t1">{max}</p>
      </div>
      <p className="mt-1 text-[15px]">{tip}</p>
    </div>
  );
}

function Item({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="font-semibold text-t1">{title}</p>
      <p>{text}</p>
    </div>
  );
}

export function OTCGuide({ t }: { t: T }) {
  return (
    <div className="pt-2">
      <Fold title={t.guide_section_doctor}>
        <ul className="list-disc space-y-1 ps-5">
          {[t.guide_doctor_1, t.guide_doctor_2, t.guide_doctor_3, t.guide_doctor_4, t.guide_doctor_5, t.guide_doctor_6, t.guide_doctor_7, t.guide_doctor_8].map((x, i) => <li key={i}>{x}</li>)}
        </ul>
        <p className="text-t1">{t.guide_doctor_why}</p>
      </Fold>

      <Fold title={t.guide_section_nondrug}>
        <Item title={t.guide_heat_title} text={t.guide_heat} />
        <Item title={t.guide_exercise_title} text={t.guide_exercise} />
        <Item title={t.guide_diet_title} text={t.guide_diet} />
        <Item title={t.guide_stress_title} text={t.guide_stress} />
        <Item title={t.guide_posture_title} text={t.guide_posture} />
      </Fold>

      <Fold title={t.guide_section_nsaids}>
        <p>{t.guide_nsaid_why_text}</p>
        <Drug name={t.guide_ibu_name} dose={t.guide_ibu_dose} interval={t.guide_ibu_interval} max={t.guide_ibu_max} tip={t.guide_ibu_tip} />
        <Drug name={t.guide_nap_name} dose={t.guide_nap_dose} interval={t.guide_nap_interval} max={t.guide_nap_max} tip={t.guide_nap_tip} />
      </Fold>

      <Fold title={t.guide_section_acetaminophen}>
        <Drug name={t.guide_apap_name} dose={t.guide_apap_dose} interval={t.guide_apap_interval} max={t.guide_apap_max} tip={t.guide_apap_tip} />
        <p>{t.guide_apap_note}</p>
      </Fold>

      <Fold title={t.guide_section_combo}>
        <p className="font-semibold text-warn">{t.guide_combo_warning}</p>
        <Item title="Pamprin Multi-Symptom" text={t.guide_pamprin_multi_detail} />
        <Item title="Pamprin Max Pain + Energy" text={t.guide_pamprin_max_detail} />
        <Item title="Midol Complete" text={t.guide_midol_detail} />
        <p className="font-semibold text-bad">{t.guide_conflict_warning}</p>
      </Fold>

      <Fold title={t.guide_section_strategy}>
        <Item title={t.guide_strategy_1_title} text={t.guide_strategy_1} />
        <Item title={t.guide_strategy_2_title} text={t.guide_strategy_2} />
        <Item title={t.guide_strategy_3_title} text={t.guide_strategy_3} />
        <Item title={t.guide_strategy_4_title} text={t.guide_strategy_4} />
        <Item title={t.guide_strategy_5_title} text={t.guide_strategy_5} />
      </Fold>

      <Fold title={t.guide_section_bleeding}>
        <p>{t.guide_pbac}</p>
        <p>{t.guide_relief}</p>
      </Fold>
    </div>
  );
}
