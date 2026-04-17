'use client';

import { useState, useEffect } from 'react';
import { exportAllData, STORAGE_KEYS } from '../../lib/storage';
import { translations, Language } from '../../data/translations';

interface Props {
  lang: Language;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function BackupReminder({ lang }: Props) {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEYS.BACKUP_REMINDER_DISABLED) === 'true') return;
      const last = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_REMINDER);
      if (!last || Date.now() - Number(last) > THIRTY_DAYS_MS) {
        setVisible(true);
      }
    } catch {}
  }, []);

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pehriod-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_REMINDER, String(Date.now()));
    setDone(true);
    setTimeout(() => setVisible(false), 1500);
  };

  const handleLater = () => {
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_REMINDER, String(Date.now()));
    setVisible(false);
  };

  const handleDisable = () => {
    localStorage.setItem(STORAGE_KEYS.BACKUP_REMINDER_DISABLED, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-3">
      <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
        <p className="font-semibold text-pink-800 text-sm mb-1">{t.backup_title}</p>
        <p className="text-xs text-pink-700 mb-3">{t.backup_body}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-pink-500 text-white rounded-lg text-xs font-medium"
          >
            {done ? '✓' : t.backup_action}
          </button>
          <button
            onClick={handleLater}
            className="px-3 py-1.5 border border-pink-300 text-pink-700 rounded-lg text-xs"
          >
            {t.backup_later}
          </button>
          <button
            onClick={handleDisable}
            className="px-3 py-1.5 text-pink-400 text-xs"
          >
            {t.backup_disable}
          </button>
        </div>
      </div>
    </div>
  );
}
