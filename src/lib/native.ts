// Bridges to Android when running as the Capacitor app; browser fallbacks otherwise.

import { Capacitor, registerPlugin, SystemBars, SystemBarsStyle } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();

const PehriodPrint = registerPlugin<{ print(opts: { name: string }): Promise<void> }>('PehriodPrint');

export async function printPage(name: string) {
  if (isNative()) await PehriodPrint.print({ name });
  else window.print();
}

/** Saves a text file: a download in the browser, the share sheet on Android. */
export async function saveTextFile(filename: string, text: string, mime: string) {
  if (!isNative()) {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const file = await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
  await Share.share({ title: filename, files: [file.uri] });
}

export function setSystemBars(dark: boolean) {
  if (!isNative()) return;
  SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {});
}

// Notification ids must be 32-bit ints; derive one from the intake id.
function notificationId(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

/** Reminds to rate relief for a dose. Inexact is fine; no exact-alarm permission is requested. */
export async function scheduleReliefReminder(intakeId: string, at: number, title: string, body: string) {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'prompt' || perm.display === 'prompt-with-rationale') perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;
    await LocalNotifications.schedule({
      notifications: [{
        id: notificationId(intakeId),
        title,
        body,
        schedule: { at: new Date(at), allowWhileIdle: true },
        isExactNotification: false,
        smallIcon: 'ic_stat_pehriod',
      }],
    });
  } catch {}
}

export async function cancelReliefReminder(intakeId: string) {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: notificationId(intakeId) }] });
  } catch {}
}

/** Android back button: runs the handler; when it returns false the app goes to the background. */
export function onBackButton(handler: () => boolean): () => void {
  if (!isNative()) return () => {};
  let remove: (() => void) | null = null;
  let cancelled = false;
  import('@capacitor/app').then(({ App }) => {
    App.addListener('backButton', () => {
      if (!handler()) App.minimizeApp();
    }).then((h) => {
      if (cancelled) h.remove();
      else remove = () => h.remove();
    });
  });
  return () => {
    cancelled = true;
    remove?.();
  };
}
