'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { STORAGE_KEYS } from '../../lib/storage';
import { downloadBackup } from '../../lib/backup';
import { T } from '../../data/translations';
import { Chip } from './kit';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isDue(): boolean {
  try {
    if (localStorage.getItem(STORAGE_KEYS.BACKUP_REMINDER_DISABLED) === 'true') return false;
    const hasData = !!localStorage.getItem(STORAGE_KEYS.CYCLE_RECORDS) || !!localStorage.getItem(STORAGE_KEYS.BLEEDS);
    if (!hasData) return false;
    const last = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_REMINDER);
    return !last || Date.now() - Number(last) > THIRTY_DAYS_MS;
  } catch {
    return false;
  }
}

export function BackupReminder({ t }: { t: T }) {
  const [visible, setVisible] = useState(isDue);

  const snooze = () => {
    try { localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_REMINDER, String(Date.now())); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mt-4 flex items-center gap-2 border-b border-line py-2">
      <span className="flex-1 text-[15px] text-t2">{t.backup_due}</span>
      <Chip on onClick={() => { downloadBackup(); snooze(); }}>{t.export}</Chip>
      <button onClick={snooze} aria-label={t.skip} className="press flex h-10 w-10 items-center justify-center text-t3"><X size={18} /></button>
    </div>
  );
}
