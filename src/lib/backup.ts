import { exportAllData } from './storage';
import { todayISO } from './dates';

export function downloadBackup() {
  const blob = new Blob([exportAllData()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pehriod-backup-${todayISO()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
