'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Language, languages, translations, T } from '../data/translations';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMedicationData } from '../hooks/useMedicationData';
import { useCycleData } from '../hooks/useCycleData';
import { useBleeds } from '../hooks/useBleeds';
import { usePrefs } from '../hooks/usePrefs';
import { useVisit } from '../hooks/useVisit';
import { STORAGE_KEYS, clearAllStorage, migrate } from '../lib/storage';
import { BleedEntry, IntakeRecord, MedicationId, Relief } from '../lib/types';
import { applyBleed, uid } from '../lib/period';
import { isoToDate, todayISO } from '../lib/dates';
import { MEDICATIONS } from '../lib/medications';
import { nextReliefDueMs } from '../lib/relief';
import { buildReport } from '../lib/report';
import { buildEvidence } from '../lib/evidence';

import { BottomNav, TabType } from '../components/ui/BottomNav';
import { SplashScreen } from '../components/ui/SplashScreen';
import { ToastProvider, buzz, useToast } from '../components/ui/kit';
import { TodayScreen } from '../components/today/TodayScreen';
import { describeEntry } from '../components/today/BleedLogger';
import { CycleScreen } from '../components/cycle/CycleScreen';
import { MedsScreen } from '../components/meds/MedsScreen';
import { VisitScreen } from '../components/visit/VisitScreen';
import { ReportView } from '../components/visit/ReportView';
import { OTCGuide } from '../components/guide/OTCGuide';
import { SettingsScreen } from '../components/settings/SettingsScreen';

if (typeof window !== 'undefined') migrate();

const TABS: TabType[] = ['today', 'cycle', 'meds', 'visit', 'guide'];
const noop = () => () => {};

export default function Home() {
  // Everything lives in localStorage, so render nothing until the client has it.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [lang, setLang] = useLocalStorage<Language | null>(STORAGE_KEYS.LANGUAGE, null);

  useEffect(() => {
    if (!lang) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = languages[lang]?.dir ?? 'ltr';
  }, [lang]);

  if (!mounted) return null;
  if (!lang || !translations[lang]) return <SplashScreen onPick={setLang} />;

  const t = translations[lang];
  return (
    <ToastProvider undoLabel={t.undo}>
      <App lang={lang} setLang={setLang} t={t} />
    </ToastProvider>
  );
}

function useNow(intakes: IntakeRecord[]) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    const onVisible = () => document.visibilityState === 'visible' && setNow(Date.now());
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  // Wake exactly when the next relief question becomes due.
  useEffect(() => {
    const due = nextReliefDueMs(intakes, Date.now());
    if (due === null || due > 2 ** 31 - 1) return;
    const id = setTimeout(() => setNow(Date.now()), due + 500);
    return () => clearTimeout(id);
  }, [intakes]);
  return now;
}

function App({ lang, setLang, t }: { lang: Language; setLang: (l: Language) => void; t: T }) {
  const toast = useToast();
  const [storedTab, setTab] = useLocalStorage<TabType>('pehriod_active_tab', 'today');
  const tab: TabType = TABS.includes(storedTab) ? storedTab : 'today';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const meds = useMedicationData();
  const cyc = useCycleData();
  const { bleeds, addBleed, removeBleed } = useBleeds();
  const [prefs, setPrefs] = usePrefs();
  const visit = useVisit();

  const now = useNow(meds.intakeHistory);
  const today = useMemo(() => todayISO(), [now]); // eslint-disable-line react-hooks/exhaustive-deps
  const todayLog = cyc.getDayLog(today);

  const { cycles, setCycles } = cyc;

  const onBleed = useCallback((partial: Omit<BleedEntry, 'id' | 'ts'>) => {
    const entry: BleedEntry = { id: uid(), ts: Date.now(), ...partial };
    const before = cycles;
    const after = applyBleed(cycles, entry, today);
    addBleed(entry);
    if (after !== before) setCycles(after);
    buzz();
    const text = describeEntry(t, entry) + (after.length > before.length ? ` · ${t.period_started}` : '');
    toast(text, () => {
      removeBleed(entry.id);
      if (after !== before) setCycles(before);
    });
  }, [cycles, today, addBleed, removeBleed, setCycles, t, toast]);

  const onRemoveBleed = useCallback((e: BleedEntry) => {
    removeBleed(e.id);
    toast(`${describeEntry(t, e)} · ${t.removed}`, () => addBleed(e));
  }, [removeBleed, addBleed, t, toast]);

  const onSpotting = useCallback((date: string) => {
    const ts = date === today ? Date.now() : isoToDate(date).getTime() + 12 * 3600e3;
    const entry: BleedEntry = { id: uid(), ts, kind: 'liner' };
    addBleed(entry);
    toast(t.spotting, () => removeBleed(entry.id));
  }, [today, addBleed, removeBleed, t, toast]);

  const onEndPeriod = useCallback((date: string) => {
    const before = cycles;
    cyc.endPeriod(date);
    toast(t.period_ended, () => setCycles(before));
  }, [cycles, cyc, setCycles, t, toast]);

  const onTake = useCallback((id: MedicationId) => {
    const ts = Date.now();
    const recId = meds.logIntake(id, ts, todayLog?.painLevel);
    buzz();
    const med = MEDICATIONS.find((m) => m.id === id)!;
    const time = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    toast(`${t[med.nameKey as keyof T] as string} · ${time}`, () => meds.deleteIntake(recId));
  }, [meds, todayLog?.painLevel, t, toast]);

  const onRelief = useCallback((id: string, r: Relief | null | undefined) => meds.setRelief(id, r), [meds]);

  const report = useMemo(
    () => (reportOpen ? buildReport(cycles, bleeds, cyc.dayLogs, meds.intakeHistory, today) : null),
    [reportOpen, cycles, bleeds, cyc.dayLogs, meds.intakeHistory, today]
  );
  const evidence = useMemo(
    () => (reportOpen ? buildEvidence(visit.answers, cycles, bleeds, cyc.dayLogs, meds.intakeHistory, today) : {}),
    [reportOpen, visit.answers, cycles, bleeds, cyc.dayLogs, meds.intakeHistory, today]
  );

  const labels: Record<TabType, string> = {
    today: t.nav_today, cycle: t.nav_cycle, meds: t.nav_meds, visit: t.nav_visit, guide: t.nav_guide,
  };

  const goTab = (next: TabType) => {
    setSettingsOpen(false);
    setTab(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-dvh" style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}>
      <div className="mx-auto max-w-md px-4" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <div className="flex h-12 items-center justify-between">
          {settingsOpen ? (
            <button onClick={() => setSettingsOpen(false)} aria-label={t.close} className="press -ms-2 flex h-11 w-11 items-center justify-center rounded-full">
              <ArrowLeft size={22} className="rtl:rotate-180" />
            </button>
          ) : tab !== 'today' ? (
            <h1 className="casual text-2xl font-extrabold">{labels[tab]}</h1>
          ) : <span />}
          {settingsOpen ? (
            <h1 className="casual text-2xl font-extrabold">{t.settings}</h1>
          ) : (
            <button onClick={() => setSettingsOpen(true)} aria-label={t.settings} className="press -me-2 flex h-11 w-11 items-center justify-center rounded-full text-t2">
              <Settings size={22} />
            </button>
          )}
        </div>

        {settingsOpen ? (
          <SettingsScreen
            t={t}
            lang={lang}
            onLanguage={setLang}
            prefs={prefs}
            setPrefs={setPrefs}
            onClearAll={() => { clearAllStorage(); window.location.reload(); }}
          />
        ) : (
          <>
            {tab === 'today' && (
              <TodayScreen
                key={today}
                t={t}
                lang={lang}
                today={today}
                now={now}
                stats={cyc.stats}
                cycles={cycles}
                bleeds={bleeds}
                dayLog={todayLog}
                dayLogs={cyc.dayLogs}
                intakes={meds.intakeHistory}
                prefs={prefs}
                setPrefs={setPrefs}
                onBleed={onBleed}
                onRemoveBleed={onRemoveBleed}
                onDay={(patch) => cyc.updateDay(today, patch)}
                onRelief={onRelief}
                onEndPeriod={onEndPeriod}
                onGoMeds={() => goTab('meds')}
              />
            )}
            {tab === 'cycle' && (
              <CycleScreen
                t={t}
                lang={lang}
                today={today}
                cycles={cycles}
                stats={cyc.stats}
                bleeds={bleeds}
                dayLogs={cyc.dayLogs}
                trackers={prefs.trackers}
                units={prefs.units}
                onSetFlow={cyc.setFlow}
                onStartPeriod={cyc.startPeriod}
                onEndPeriod={onEndPeriod}
                onAddPast={cyc.addPastCycle}
                onDeleteCycle={cyc.deleteCycle}
                onSpotting={onSpotting}
                onRemoveBleed={onRemoveBleed}
              />
            )}
            {tab === 'meds' && (
              <MedsScreen
                t={t}
                lang={lang}
                now={now}
                today={today}
                intakes={meds.intakeHistory}
                doseTotals={meds.doseTotals}
                onTake={onTake}
                onDelete={meds.deleteIntake}
                onSetTime={meds.setIntakeTime}
                onRelief={onRelief}
              />
            )}
            {tab === 'visit' && (
              <VisitScreen
                t={t}
                answers={visit.answers}
                units={prefs.units}
                doctorLang={prefs.doctorLang}
                onDoctorLang={(l) => setPrefs({ doctorLang: l })}
                onAnswer={visit.setAnswer}
                onClear={visit.clearAnswers}
                onOpenReport={() => setReportOpen(true)}
              />
            )}
            {tab === 'guide' && <OTCGuide t={t} />}
          </>
        )}
      </div>

      <BottomNav active={settingsOpen ? null : tab} onChange={goTab} labels={labels} />

      {reportOpen && report && (
        <ReportView
          t={t}
          td={translations[prefs.doctorLang]}
          lang={lang}
          doctorLang={prefs.doctorLang}
          report={report}
          evidence={evidence}
          answers={visit.answers}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
