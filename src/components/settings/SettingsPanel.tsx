'use client';

import { useState } from 'react';
import { Language, languages } from '../../data/translations';
import { translations } from '../../data/translations';
import { exportAllData, clearAllStorage } from '../../lib/storage';

interface Props {
  lang: Language;
  onLanguageChange: (l: Language) => void;
  onClearAll: () => void;
}

export function SettingsPanel({ lang, onLanguageChange, onClearAll }: Props) {
  const t = translations[lang];
  const [clearConfirm, setClearConfirm] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    const data = exportAllData();
    navigator.clipboard.writeText(data).then(() => {
      setExported(true);
      setTimeout(() => setExported(false), 2000);
    });
  };

  const handleClear = () => {
    clearAllStorage();
    onClearAll();
    setClearConfirm(false);
  };

  return (
    <div className="space-y-4">
      {/* Language */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">{t.settings_language}</h2>
        <div className="flex gap-2">
          {(Object.keys(languages) as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => onLanguageChange(l)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                lang === l
                  ? 'bg-pink-500 text-white border-pink-500'
                  : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              {languages[l].name}
            </button>
          ))}
        </div>
      </div>

      {/* Data */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">{t.settings_data}</h2>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm text-left px-3"
          >
            {exported ? `✓ ${t.settings_export_done}` : `⬇ ${t.settings_export}`}
          </button>
          <button
            onClick={() => setClearConfirm(true)}
            className="w-full py-2.5 border border-red-200 text-red-600 rounded-lg text-sm text-left px-3"
          >
            🗑 {t.settings_clear}
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-1">{t.settings_about}</h2>
        <p className="text-xs text-gray-500 mb-1">{t.settings_about_text}</p>
        <p className="text-xs text-gray-400">{t.settings_version}</p>
      </div>

      {/* Clear confirm modal */}
      {clearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <p className="font-semibold text-gray-800 mb-2">{t.settings_clear}</p>
            <p className="text-sm text-gray-600 mb-4">{t.settings_clear_confirm}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setClearConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm"
              >
                {t.settings_clear_cancel}
              </button>
              <button
                onClick={handleClear}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium"
              >
                {t.settings_clear_yes}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
