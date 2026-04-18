'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'auto' | 'light' | 'dark';

const LEGACY_HUE: Record<string, number> = {
  pink: 330, rose: 350, purple: 280, blue: 220, teal: 175, orange: 25,
};

interface ThemeCtx {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  isDark: boolean;
  accentHue: number;
  setAccentHue: (h: number) => void;
}

const Ctx = createContext<ThemeCtx>({
  mode: 'auto', setMode: () => {}, isDark: false,
  accentHue: 330, setAccentHue: () => {},
});

function applyDark(isDark: boolean) {
  const h = document.documentElement;
  if (isDark) { h.classList.add('dark'); h.classList.remove('light'); }
  else { h.classList.remove('dark', 'light'); }
}

function applyHue(hue: number) {
  document.documentElement.style.setProperty('--ah', String(hue));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [isDark, setIsDark] = useState(false);
  const [accentHue, setAccentHueState] = useState<number>(330);

  useEffect(() => {
    const storedMode = localStorage.getItem('pehriod_theme') as ThemeMode | null;
    if (storedMode) setModeState(storedMode);

    const storedHue = localStorage.getItem('pehriod_accent_hue');
    if (storedHue !== null) {
      const h = Number(storedHue);
      setAccentHueState(h);
      applyHue(h);
    } else {
      // Migrate from old ThemeColor
      const legacyColor = localStorage.getItem('pehriod_theme_color');
      if (legacyColor && LEGACY_HUE[legacyColor] !== undefined) {
        const h = LEGACY_HUE[legacyColor];
        setAccentHueState(h);
        applyHue(h);
      }
    }
  }, []);

  useEffect(() => {
    const h = document.documentElement;
    if (mode === 'dark') {
      h.classList.add('dark'); h.classList.remove('light');
      setIsDark(true);
    } else if (mode === 'light') {
      h.classList.remove('dark'); h.classList.add('light');
      setIsDark(false);
    } else {
      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyDark(sys);
      setIsDark(sys);
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => { applyDark(e.matches); setIsDark(e.matches); };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem('pehriod_theme', m);
  };

  const setAccentHue = (h: number) => {
    setAccentHueState(h);
    localStorage.setItem('pehriod_accent_hue', String(h));
    applyHue(h);
  };

  return <Ctx.Provider value={{ mode, setMode, isDark, accentHue, setAccentHue }}>{children}</Ctx.Provider>;
}

export function useTheme() { return useContext(Ctx); }
