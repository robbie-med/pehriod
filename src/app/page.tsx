'use client';

import { useState, useEffect } from 'react';
import { languages, translations, Language } from '../data/translations';
import { MedicationId, ActiveIngredient } from '../lib/types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMedicationData } from '../hooks/useMedicationData';
import { useRecommendation } from '../hooks/useRecommendation';
import { STORAGE_KEYS } from '../lib/storage';

// UI Components
import { Header } from '../components/ui/Header';
import { BottomNav, TabType } from '../components/ui/BottomNav';

// Tracker Components
import { SymptomSlider } from '../components/tracker/SymptomSlider';
import { DoseSummaryCard } from '../components/tracker/DoseSummaryCard';
import { MedicationTimeline } from '../components/tracker/MedicationTimeline';

// History Components
import { IntakeHistory } from '../components/history/IntakeHistory';

// Medication Info Components
import { MedicationList } from '../components/medications/MedicationList';

// Education Components
import { EducationContent } from '../components/education/EducationContent';

// Settings Components
import { LanguageSelector } from '../components/settings/LanguageSelector';

export default function Home() {
  const [lang, setLang] = useLocalStorage<Language>(STORAGE_KEYS.LANGUAGE, 'en');
  const [activeTab, setActiveTab] = useState<TabType>('tracker');

  // Get medication data state
  const {
    intakeHistory,
    painLevel,
    setPainLevel,
    doseTotals,
    logIntake,
    deleteIntake,
  } = useMedicationData();

  // Get recommendation
  const recommendation = useRecommendation(intakeHistory, doseTotals);

  const t = translations[lang];
  const dir = languages[lang].dir;

  // Set document language and direction
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  // Medication names for current language
  const medicationNames: Record<MedicationId, string> = {
    'pamprin-multi': t.med_pamprin_multi || 'Pamprin Multi-Symptom',
    'pamprin-max-energy': t.med_pamprin_max || 'Pamprin Max Pain + Energy',
    'midol-complete': t.med_midol_complete || 'Midol Complete',
    ibuprofen: t.med_ibuprofen || 'Ibuprofen',
    acetaminophen: t.med_acetaminophen || 'Acetaminophen',
  };

  // Medication descriptions
  const medicationDescriptions: Record<MedicationId, string> = {
    'pamprin-multi':
      t.med_pamprin_multi_desc ||
      'Contains: Acetaminophen (Pain), Pamabrom (Diuretic), Pyrilamine Maleate (Antihistamine).',
    'pamprin-max-energy':
      t.med_pamprin_max_desc ||
      'Contains: Acetaminophen, Aspirin, Caffeine for pain and energy.',
    'midol-complete':
      t.med_midol_complete_desc ||
      'Contains: Acetaminophen, Caffeine, Pyrilamine Maleate.',
    ibuprofen: t.med_ibuprofen_desc || 'Nonsteroidal anti-inflammatory drug (NSAID).',
    acetaminophen: t.med_acetaminophen_desc || 'Pain reliever and fever reducer.',
  };

  // Ingredient labels
  const ingredientLabels: Record<ActiveIngredient, string> = {
    acetaminophen: t.ingredient_acetaminophen || 'Acetaminophen',
    ibuprofen: t.ingredient_ibuprofen || 'Ibuprofen',
    aspirin: t.ingredient_aspirin || 'Aspirin',
    caffeine: t.ingredient_caffeine || 'Caffeine',
    pamabrom: t.ingredient_pamabrom || 'Pamabrom',
    pyrilamine: t.ingredient_pyrilamine || 'Pyrilamine',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title={t.title} onSettingsClick={() => setActiveTab('settings')} />

      <main className="max-w-3xl mx-auto p-4">
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            <SymptomSlider
              painLevel={painLevel}
              onPainLevelChange={setPainLevel}
              label={t.pain_level}
            />

            <DoseSummaryCard
              doseTotals={doseTotals}
              title={t.total_24hr || '24-Hour Totals'}
              ingredientLabels={ingredientLabels}
            />

            <MedicationTimeline
              intakeHistory={intakeHistory}
              doseTotals={doseTotals}
              painLevel={painLevel}
              onLogIntake={logIntake}
              translations={{
                schedule: t.schedule,
                take: t.take,
                taken: t.taken,
                choose_one: t.choose_one || 'Choose one',
                confirm_intake: t.confirm_intake || 'Confirm',
                cancel: t.cancel || 'Cancel',
                note: t.note,
              }}
              medicationNames={medicationNames}
            />

            <IntakeHistory
              intakeHistory={intakeHistory}
              onDelete={deleteIntake}
              medicationNames={medicationNames}
              translations={{
                no_history: t.no_history || 'No medication history yet',
                delete: t.delete || 'Delete',
              }}
            />
          </div>
        )}

        {activeTab === 'education' && (
          <EducationContent
            title={t.education_title || 'Understanding Period Pain'}
            content={
              t.education_content ||
              'Dysmenorrhea (painful periods) is caused by prostaglandins, chemicals that trigger muscle contractions in your uterus. Over-the-counter pain medications work by blocking prostaglandin production or reducing inflammation.'
            }
          />
        )}

        {activeTab === 'meds' && (
          <MedicationList
            title={t.meds}
            medicationNames={medicationNames}
            medicationDescriptions={medicationDescriptions}
            ingredientLabels={ingredientLabels}
          />
        )}

        {activeTab === 'settings' && (
          <LanguageSelector
            currentLanguage={lang}
            onLanguageChange={(newLang) => {
              setLang(newLang);
              setActiveTab('tracker');
            }}
            title={t.settings}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        labels={{
          tracker: t.tracker,
          education: t.education,
          meds: t.meds,
        }}
      />
    </div>
  );
}
