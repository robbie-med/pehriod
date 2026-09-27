import { exportAllData } from './storage';
import { todayISO } from './dates';
import { saveTextFile } from './native';

export function downloadBackup() {
  return saveTextFile(`pehriod-backup-${todayISO()}.json`, exportAllData(), 'application/json');
}
