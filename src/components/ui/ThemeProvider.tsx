'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'auto' | 'light' | 'dark';

export const DEFAULT_HUE = 8;

interface ThemeCtx {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  accentHue: number;
  setAccentHue: (h: number) => void;
}

const Ctx = createContext<ThemeCtx>({
  mode: 'auto', setMode: () => {}, accentHue: DEFAULT_HUE, setAccentHue: () => {},
});

function readMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto';
  try {
    const m = localStorage.getItem('pehriod_theme');
    return m === 'light' || m === 'dark' ? m : 'auto';
  } catch {
    return 'auto';
  }
}

function readHue(): number {
  if (typeof window === 'undefined') return DEFAULT_HUE;
  try {
    const h = localStorage.getItem('pehriod_accent_hue');
    return h === null ? DEFAULT_HUE : Number(h);
  } catch {
    return DEFAULT_HUE;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readMode);
  const [accentHue, setAccentHueState] = useState<number>(readHue);

  useEffect(() => {
    const h = document.documentElement;
    const apply = (dark: boolean) => {
      h.classList.toggle('dark', dark);
      h.classList.toggle('light', mode === 'light');
    };
    if (mode !== 'auto') {
      apply(mode === 'dark');
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches);
    const onChange = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    try { localStorage.setItem('pehriod_theme', m); } catch {}
  };

  const setAccentHue = (hue: number) => {
    setAccentHueState(hue);
    document.documentElement.style.setProperty('--ah', String(hue));
    try { localStorage.setItem('pehriod_accent_hue', String(hue)); } catch {}
  };

  return <Ctx.Provider value={{ mode, setMode, accentHue, setAccentHue }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
