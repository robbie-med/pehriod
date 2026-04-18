'use client';

import { useState } from 'react';
import { translations, Language } from '../../data/translations';

interface Props {
  lang: Language;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-semibold text-gray-800">{title}</span>
        <span className="text-gray-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-4 text-sm text-gray-700 space-y-3">{children}</div>}
    </div>
  );
}

function DrugCard({ name, dose, interval, max, tip, color }: {
  name: string; dose: string; interval: string; max: string; tip: string;
  color: 'orange' | 'purple' | 'green' | 'pink' | 'blue';
}) {
  const bg: Record<string, string> = {
    orange: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    pink: 'bg-pink-50 border-pink-200',
    blue: 'bg-blue-50 border-blue-200',
  };
  return (
    <div className={`rounded-lg border p-3 ${bg[color]}`}>
      <p className="font-semibold text-gray-800 mb-2">{name}</p>
      <div className="space-y-1 text-xs text-gray-600">
        <p>💊 {dose}</p>
        <p>⏱ {interval}</p>
        <p>🚫 {max}</p>
        <p className="text-gray-500 italic mt-1">{tip}</p>
      </div>
    </div>
  );
}

function InfoBox({ text, variant = 'info' }: { text: string; variant?: 'info' | 'warning' | 'danger' }) {
  const cls = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
  };
  return (
    <div className={`rounded-lg border p-3 text-xs ${cls[variant]}`}>
      {text}
    </div>
  );
}

function StrategyItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-l-2 border-pink-300 pl-3">
      <p className="font-medium text-gray-800 mb-0.5">{title}</p>
      <p className="text-gray-600">{text}</p>
    </div>
  );
}

export function OTCGuide({ lang }: Props) {
  const t = translations[lang];

  return (
    <div className="space-y-3">
      <div className="bg-pink-50 rounded-xl p-4 text-sm text-gray-700">
        {t.guide_intro}
      </div>

      {/* Non-drug — top priority */}
      <Section title={t.guide_section_nondrug}>
        <p className="text-gray-500 mb-2">{t.guide_nondrug_intro}</p>
        <div className="space-y-3">
          <StrategyItem title={`🔥 ${t.guide_heat_title}`} text={t.guide_heat} />
          <StrategyItem title={`🏃 ${t.guide_exercise_title}`} text={t.guide_exercise} />
          <StrategyItem title={`🥗 ${t.guide_diet_title}`} text={t.guide_diet} />
          <StrategyItem title={`🧘 ${t.guide_stress_title}`} text={t.guide_stress} />
          <StrategyItem title={`🛋 ${t.guide_posture_title}`} text={t.guide_posture} />
        </div>
      </Section>

      {/* NSAIDs */}
      <Section title={t.guide_section_nsaids}>
        <InfoBox text={`${t.guide_nsaid_why}: ${t.guide_nsaid_why_text}`} variant="info" />
        <DrugCard
          color="orange"
          name={t.guide_ibu_name}
          dose={t.guide_ibu_dose}
          interval={t.guide_ibu_interval}
          max={t.guide_ibu_max}
          tip={t.guide_ibu_tip}
        />
        <DrugCard
          color="purple"
          name={t.guide_nap_name}
          dose={t.guide_nap_dose}
          interval={t.guide_nap_interval}
          max={t.guide_nap_max}
          tip={t.guide_nap_tip}
        />
      </Section>

      {/* Acetaminophen */}
      <Section title={t.guide_section_acetaminophen}>
        <DrugCard
          color="green"
          name={t.guide_apap_name}
          dose={t.guide_apap_dose}
          interval={t.guide_apap_interval}
          max={t.guide_apap_max}
          tip={t.guide_apap_tip}
        />
        <InfoBox text={t.guide_apap_note} variant="info" />
      </Section>

      {/* Combination products */}
      <Section title={t.guide_section_combo}>
        <InfoBox text={t.guide_combo_warning} variant="warning" />

        <div className="space-y-2">
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
            <p className="font-semibold text-gray-800 text-xs mb-1">Pamprin Multi-Symptom</p>
            <p className="text-xs text-gray-600">{t.guide_pamprin_multi_detail}</p>
          </div>
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
            <p className="font-semibold text-gray-800 text-xs mb-1">Pamprin Max Pain + Energy</p>
            <p className="text-xs text-gray-600">{t.guide_pamprin_max_detail}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-semibold text-gray-800 text-xs mb-1">Midol Complete</p>
            <p className="text-xs text-gray-600">{t.guide_midol_detail}</p>
          </div>
        </div>

        <InfoBox text={t.guide_conflict_warning} variant="danger" />
      </Section>

      {/* Strategy */}
      <Section title={t.guide_section_strategy}>
        <p className="text-gray-600 mb-2">{t.guide_strategy_intro}</p>
        <div className="space-y-3">
          <StrategyItem title={t.guide_strategy_1_title} text={t.guide_strategy_1} />
          <StrategyItem title={t.guide_strategy_2_title} text={t.guide_strategy_2} />
          <StrategyItem title={t.guide_strategy_3_title} text={t.guide_strategy_3} />
          <StrategyItem title={t.guide_strategy_4_title} text={t.guide_strategy_4} />
          <StrategyItem title={t.guide_strategy_5_title} text={t.guide_strategy_5} />
        </div>
      </Section>

      {/* Doctor */}
      <Section title={`🏥 ${t.guide_section_doctor}`}>
        <p className="text-gray-600 mb-2">{t.guide_doctor_intro}</p>
        <ul className="space-y-1.5">
          {[
            t.guide_doctor_1, t.guide_doctor_2, t.guide_doctor_3,
            t.guide_doctor_4, t.guide_doctor_5, t.guide_doctor_6,
            t.guide_doctor_7, t.guide_doctor_8,
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <InfoBox text={t.guide_doctor_why} variant="warning" />
      </Section>
    </div>
  );
}
