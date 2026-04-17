'use client';

import { useEffect } from 'react';
import { Language } from '../data/translations';
import { translations, languages } from '../data/translations';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMedicationData } from '../hooks/useMedicationData';
import { useCycleData } from '../hooks/useCycleData';
import { STORAGE_KEYS } from '../lib/storage';
import { clearAllStorage } from '../lib/storage';

import { Header } from '../components/ui/Header';
import { BottomNav, TabType } from '../components/ui/BottomNav';
import { BackupReminder } from '../components/ui/BackupReminder';
import { TodayDashboard } from '../components/today/TodayDashboard';
import { CycleTracker } from '../components/cycle/CycleTracker';
import { MedLogger } from '../components/meds/MedLogger';
import { OTCGuide } from '../components/guide/OTCGuide';
import { SettingsPanel } from '../components/settings/SettingsPanel';

export default function Home() {
  const [lang, setLang] = useLocalStorage<Language>(STORAGE_KEYS.LANGUAGE, 'en');
  const [activeTab, setActiveTab] = useLocalStorage<TabType>('pehriod_active_tab', 'today');

  const { intakeHistory, painLevel, setPainLevel, doseTotals, logIntake, deleteIntake, clearHistory } =
    useMedicationData();

  const { cycles, dayLogs, stats, startPeriod, endPeriod, addPastCycle, logFlow, deleteCycle, saveDayLog, getDayLog } =
    useCycleData();

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = languages[lang].dir;
  }, [lang]);

  const handleClearAll = () => {
    clearAllStorage();
    clearHistory();
    window.location.reload();
  };

  const tabLabels: Record<TabType, string> = {
    today: t.nav_today,
    cycle: t.nav_cycle,
    meds: t.nav_meds,
    guide: t.nav_guide,
    settings: t.nav_settings,
  };

  const todayLog = getDayLog(new Date().toISOString().split('T')[0]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title={t.app_title} />
      <BackupReminder lang={lang} />

      <main className="max-w-2xl mx-auto px-4 pt-4">
        {activeTab === 'today' && (
          <TodayDashboard
            stats={stats}
            intakeHistory={intakeHistory}
            painLevel={painLevel}
            onPainChange={setPainLevel}
            dayLog={todayLog}
            onSaveDayLog={saveDayLog}
            onGoToMeds={() => setActiveTab('meds')}
            onGoToCycle={() => setActiveTab('cycle')}
            lang={lang}
          />
        )}

        {activeTab === 'cycle' && (
          <CycleTracker
            cycles={cycles}
            dayLogs={dayLogs}
            stats={stats}
            onStartPeriod={startPeriod}
            onEndPeriod={endPeriod}
            onLogFlow={logFlow}
            onDeleteCycle={deleteCycle}
            onAddPastCycle={addPastCycle}
            lang={lang}
          />
        )}

        {activeTab === 'meds' && (
          <MedLogger
            intakeHistory={intakeHistory}
            doseTotals={doseTotals}
            onLogIntake={logIntake}
            onDeleteIntake={deleteIntake}
            lang={lang}
          />
        )}

        {activeTab === 'guide' && <OTCGuide lang={lang} />}

        {activeTab === 'settings' && (
          <SettingsPanel
            lang={lang}
            onLanguageChange={setLang}
            onClearAll={handleClearAll}
            cycles={cycles}
            stats={stats}
            intakeHistory={intakeHistory}
            dayLogs={dayLogs}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} labels={tabLabels} />
    </div>
  );
}
