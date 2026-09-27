'use client';

import { useState } from 'react';
import { Prefs, importAllData } from '../../lib/storage';
import { downloadBackup } from '../../lib/backup';
import { TRACKER_IDS, TrackerId } from '../../lib/trackers';
import { T, Language, languages } from '../../data/translations';
import { useTheme, ThemeMode } from '../ui/ThemeProvider';
import { Button, Chip, Row, Section, Seg } from '../ui/kit';

interface Props {
  t: T;
  lang: Language;
  onLanguage: (l: Language) => void;
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
  onClearAll: () => void;
}

export function SettingsScreen({ t, lang, onLanguage, prefs, setPrefs, onClearAll }: Props) {
  const { mode, setMode, accentHue, setAccentHue } = useTheme();
  const [confirmClear, setConfirmClear] = useState(false);
  const [importState, setImportState] = useState<'idle' | 'ok' | 'error'>('idle');

  const toggleTracker = (id: TrackerId) =>
    setPrefs({ trackers: prefs.trackers.includes(id) ? prefs.trackers.filter((x) => x !== id) : [...prefs.trackers, id] });

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = importAllData(String(ev.target?.result ?? ''));
      setImportState(res.ok ? 'ok' : 'error');
      if (res.ok) setTimeout(() => window.location.reload(), 700);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div>
      <Section title={t.language} className="pt-2">
        <Seg value={lang} onChange={onLanguage} options={(Object.keys(languages) as Language[]).map((l) => ({ value: l, label: languages[l].name }))} />
      </Section>

      <Section title={t.appearance}>
        <Seg<ThemeMode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'auto', label: t.theme_auto },
            { value: 'light', label: t.theme_light },
            { value: 'dark', label: t.theme_dark },
          ]}
        />
        <div className="mt-4 flex items-center gap-3">
          <input type="range" min={0} max={359} value={accentHue} onChange={(e) => setAccentHue(Number(e.target.value))} className="range hue flex-1" aria-label={t.accent} />
          <span className="h-9 w-9 shrink-0 rounded-full bg-accent" />
        </div>
      </Section>

      <Section title={t.units}>
        <Seg value={prefs.units} onChange={(u) => setPrefs({ units: u })} options={[{ value: 'metric', label: 'kg · °C · cm' }, { value: 'imperial', label: 'lb · °F · in' }]} />
      </Section>

      <Section title={t.trackers}>
        <div className="flex flex-wrap gap-1.5">
          {TRACKER_IDS.map((id) => (
            <Chip key={id} on={prefs.trackers.includes(id)} onClick={() => toggleTracker(id)}>{t[`tr_${id}`]}</Chip>
          ))}
        </div>
      </Section>

      <Section title={t.data}>
        <Row label={t.export} onClick={downloadBackup} />
        <label className="press flex min-h-14 cursor-pointer items-center border-b border-line py-2.5">
          <span className="flex-1">{importState === 'ok' ? t.imported : importState === 'error' ? t.import_failed : t.import}</span>
          <input type="file" accept=".json,application/json" className="hidden" onChange={onImport} />
        </label>
        {confirmClear ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button kind="quiet" onClick={() => setConfirmClear(false)}>{t.cancel}</Button>
            <Button kind="danger" onClick={onClearAll}>{t.delete_all}</Button>
          </div>
        ) : (
          <Row label={<span className="text-bad">{t.delete_all}</span>} onClick={() => setConfirmClear(true)} />
        )}
      </Section>

      <Section title={t.about}>
        <div className="space-y-2 text-[15px] text-t2">
          <p>{t.about_private}</p>
          <p>{t.about_meds}</p>
          <p>{t.about_translations}</p>
          <a href="mailto:pehriod@robbiemed.org" className="block font-semibold text-accent">pehriod@robbiemed.org</a>
          <p className="text-t3">3.0</p>
        </div>
      </Section>
    </div>
  );
}
