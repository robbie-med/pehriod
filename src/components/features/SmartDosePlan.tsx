'use client';

import { IntakeRecord } from '../../lib/types';
import { translations, Language } from '../../data/translations';

interface Props {
  intakeHistory: IntakeRecord[];
  lang: Language;
}

const IBU_INTERVAL_MS = 4 * 60 * 60 * 1000;
const APAP_INTERVAL_MS = 4 * 60 * 60 * 1000;

function lastDoseTime(medId: string, history: IntakeRecord[]): number | null {
  const doses = history
    .filter((i) => i.medicationId === medId)
    .sort((a, b) => b.timestamp - a.timestamp);
  return doses[0]?.timestamp ?? null;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(ts: number, now: number, lang: Language): string {
  const diffMs = ts - now;
  if (diffMs <= 0) return lang === 'ko' ? '지금' : 'now';
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return lang === 'ko' ? `${diffMin}분 후` : `in ${diffMin}m`;
  const diffHr = Math.round(diffMin / 60);
  return lang === 'ko' ? `${diffHr}시간 후` : `in ${diffHr}h`;
}

interface Slot {
  medId: 'ibuprofen' | 'acetaminophen';
  avail: number;
}

export function SmartDosePlan({ intakeHistory, lang }: Props) {
  const t = translations[lang];
  const now = Date.now();

  const lastIbu = lastDoseTime('ibuprofen', intakeHistory);
  const lastApap = lastDoseTime('acetaminophen', intakeHistory);

  if (!lastIbu && !lastApap) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-1">{t.plan_title}</h2>
        <p className="text-sm text-gray-400">{t.plan_empty}</p>
      </div>
    );
  }

  const ibuAvail = lastIbu ? lastIbu + IBU_INTERVAL_MS : now;
  const apapAvail = lastApap ? lastApap + APAP_INTERVAL_MS : now;

  // Build 4-slot alternating schedule starting from whichever is available soonest
  const slots: Slot[] = [];
  let nextIbu = Math.max(ibuAvail, now - 5 * 60 * 1000); // allow 5min grace
  let nextApap = Math.max(apapAvail, now - 5 * 60 * 1000);

  for (let i = 0; i < 4; i++) {
    if (nextIbu <= nextApap) {
      slots.push({ medId: 'ibuprofen', avail: nextIbu });
      nextIbu = Math.max(nextIbu + IBU_INTERVAL_MS, nextApap + 30 * 60 * 1000);
    } else {
      slots.push({ medId: 'acetaminophen', avail: nextApap });
      nextApap = Math.max(nextApap + APAP_INTERVAL_MS, nextIbu + 30 * 60 * 1000);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h2 className="font-semibold text-gray-800 mb-0.5">{t.plan_title}</h2>
      <p className="text-xs text-gray-400 mb-3">{t.plan_note}</p>
      <div className="space-y-2">
        {slots.map((slot, i) => {
          const isFirst = i === 0;
          const isNow = slot.avail <= now;
          const label = slot.medId === 'ibuprofen' ? t.plan_take_ibu : t.plan_take_apap;
          const rel = formatRelative(slot.avail, now, lang);
          const timeStr = formatTime(slot.avail);

          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isFirst
                  ? isNow
                    ? 'bg-pink-50 border border-pink-200'
                    : 'bg-gray-50 border border-gray-100'
                  : 'bg-gray-50'
              }`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isFirst && isNow ? 'bg-pink-500' : isFirst ? 'bg-pink-300' : 'bg-gray-200'
              }`} />
              <p className={`flex-1 text-sm ${isFirst ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                {isFirst && isNow ? `${t.plan_next} ` : ''}{label}
              </p>
              <span className={`text-xs ${isFirst && isNow ? 'text-pink-600 font-medium' : 'text-gray-400'}`}>
                {isNow ? rel : timeStr}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
