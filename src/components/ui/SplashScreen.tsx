'use client';

import { Language, languages } from '../../data/translations';

export function SplashScreen({ onPick }: { onPick: (lang: Language) => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6">
      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, tiny SVG */}
        <img src="/icon.svg" alt="" className="h-16 w-16 rounded-2xl" />
        <h1 className="casual text-4xl font-extrabold tracking-tight">Pehriod</h1>
      </div>
      <div className="grid w-full max-w-xs gap-2">
        {(Object.keys(languages) as Language[]).map((l) => (
          <button
            key={l}
            onClick={() => onPick(l)}
            lang={l}
            className="press h-14 rounded-2xl bg-raise text-lg font-semibold"
          >
            {languages[l].name}
          </button>
        ))}
      </div>
    </div>
  );
}
