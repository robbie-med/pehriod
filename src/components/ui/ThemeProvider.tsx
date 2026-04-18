'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ThemeColor = 'pink' | 'purple' | 'blue' | 'teal' | 'rose' | 'orange';

interface ThemeCtx {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  isDark: boolean;
  color: ThemeColor;
  setColor: (c: ThemeColor) => void;
}

const Ctx = createContext<ThemeCtx>({
  mode: 'auto', setMode: () => {}, isDark: false,
  color: 'pink', setColor: () => {},
});

function applyDark(isDark: boolean) {
  const h = document.documentElement;
  if (isDark) { h.classList.add('dark'); h.classList.remove('light'); }
  else { h.classList.remove('dark', 'light'); }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [isDark, setIsDark] = useState(false);
  const [color, setColorState] = useState<ThemeColor>('pink');

  useEffect(() => {
    const storedMode = localStorage.getItem('pehriod_theme') as ThemeMode | null;
    const storedColor = localStorage.getItem('pehriod_theme_color') as ThemeColor | null;
    if (storedMode) setModeState(storedMode);
    if (storedColor) setColorState(storedColor);
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
      // auto — apply dark class based on system preference (CSS overrides rely on .dark class)
      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyDark(sys);
      setIsDark(sys);

      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        applyDark(e.matches);
        setIsDark(e.matches);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem('pehriod_theme', m);
  };

  const setColor = (c: ThemeColor) => {
    setColorState(c);
    localStorage.setItem('pehriod_theme_color', c);
    const h = document.documentElement;
    if (c === 'pink') h.removeAttribute('data-theme');
    else h.setAttribute('data-theme', c);
  };

  return <Ctx.Provider value={{ mode, setMode, isDark, color, setColor }}>{children}</Ctx.Provider>;
}

export function useTheme() { return useContext(Ctx); }
