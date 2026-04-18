'use client';

import { useState } from 'react';
import { Language, languages, translations } from '../../data/translations';

interface Props {
  onComplete: (lang: Language) => void;
}

export function SplashScreen({ onComplete }: Props) {
  const [step, setStep] = useState<'lang' | 'privacy'>('lang');
  const [selectedLang, setSelectedLang] = useState<Language>('en');

  const t = translations[selectedLang];

  const handleLangContinue = () => {
    setStep('privacy');
  };

  const handleStart = () => {
    onComplete(selectedLang);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-rose-900 via-pink-700 to-pink-400 p-6">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <img src="/icon.svg" alt="Pehriod" className="w-20 h-20 rounded-2xl shadow-2xl" />
        <h1 className="text-3xl font-bold text-white tracking-tight">Pehriod</h1>
      </div>

      {step === 'lang' && (
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-5">
          <div className="text-center">
            <p className="text-white text-lg font-semibold">{t.splash_lang_title}</p>
            <p className="text-white/70 text-sm mt-1">{t.splash_lang_subtitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(languages) as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLang(l)}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  selectedLang === l
                    ? 'bg-white text-pink-700 shadow-lg scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {languages[l].name}
              </button>
            ))}
          </div>

          <button
            onClick={handleLangContinue}
            className="w-full py-3 bg-white text-pink-700 rounded-xl font-semibold text-sm shadow-lg"
          >
            {translations[selectedLang].splash_lang_continue} →
          </button>
        </div>
      )}

      {step === 'privacy' && (
        <div className="w-full max-w-sm space-y-4">
          {/* Privacy card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🔒</span>
              <div>
                <p className="text-white font-semibold text-sm">{t.splash_privacy_title}</p>
                <p className="text-white/75 text-xs mt-1 leading-relaxed">{t.splash_privacy_body}</p>
              </div>
            </div>
          </div>

          {/* Backup card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">💾</span>
              <div>
                <p className="text-white font-semibold text-sm">{t.splash_backup_title}</p>
                <p className="text-white/75 text-xs mt-1 leading-relaxed">{t.splash_backup_body}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3 bg-white text-pink-700 rounded-xl font-semibold text-sm shadow-lg mt-2"
          >
            {t.splash_start} →
          </button>
        </div>
      )}
    </div>
  );
}
