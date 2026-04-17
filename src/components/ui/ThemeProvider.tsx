'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeCtx {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  isDark: boolean;
}

const Ctx = createContext<ThemeCtx>({ mode: 'auto', setMode: () => {}, isDark: false });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('pehriod_theme') as ThemeMode | null;
    if (stored) setModeState(stored);
  }, []);

  useEffect(() => {
    const applyTheme = (m: ThemeMode) => {
      const html = document.documentElement;
      if (m === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
        setIsDark(true);
      } else if (m === 'light') {
        html.classList.remove('dark');
        html.classList.add('light');
        setIsDark(false);
      } else {
        // auto: follow system
        html.classList.remove('dark', 'light');
        const sys = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(sys);
      }
    };

    applyTheme(mode);

    if (mode === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem('pehriod_theme', m);
  };

  return <Ctx.Provider value={{ mode, setMode, isDark }}>{children}</Ctx.Provider>;
}

export function useTheme() { return useContext(Ctx); }
