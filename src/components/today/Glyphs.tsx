import { Fill, Product } from '../../lib/types';

const STAIN = 'var(--flow-medium)';

export function PadGlyph({ fill, size = 56 }: { fill: Fill; size?: number }) {
  const stain = { 1: [5, 7], 2: [9, 17], 3: [12, 27] }[fill];
  return (
    <svg width={size * 0.62} height={size} viewBox="0 0 40 64" aria-hidden>
      <path d="M12 3h16a8 8 0 0 1 8 8v12l3 3v12l-3 3v12a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8V41l-3-3V26l3-3V11a8 8 0 0 1 8-8z"
        fill="var(--raise2)" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
      <ellipse cx="20" cy="32" rx={stain[0]} ry={stain[1]} fill={STAIN} />
    </svg>
  );
}

export function TamponGlyph({ fill, size = 56 }: { fill: Fill; size?: number }) {
  const level = { 1: 0.22, 2: 0.55, 3: 1 }[fill];
  const top = 4;
  const h = 44;
  return (
    <svg width={size * 0.5} height={size} viewBox="0 0 32 64" aria-hidden>
      <defs>
        <clipPath id={`tc${fill}`}><rect x="6" y={top} width="20" height={h} rx="10" /></clipPath>
      </defs>
      <rect x="6" y={top} width="20" height={h} rx="10" fill="var(--raise2)" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
      <rect x="6" y={top} width="20" height={h * level} fill={STAIN} clipPath={`url(#tc${fill})`} />
      <path d="M16 48c0 5 -3 7 -1 12" fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CupGlyph({ level, size = 56 }: { level: number; size?: number }) {
  const inner = 30;
  const y = 10 + inner * (1 - level);
  return (
    <svg width={size * 0.7} height={size} viewBox="0 0 44 64" aria-hidden>
      <defs>
        <clipPath id={`cc${Math.round(level * 100)}`}><path d="M6 8h32l-3 26a13 13 0 0 1-26 0z" /></clipPath>
      </defs>
      <path d="M6 8h32l-3 26a13 13 0 0 1-26 0z" fill="var(--raise2)" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
      <rect x="0" y={y} width="44" height="60" fill={STAIN} clipPath={`url(#cc${Math.round(level * 100)})`} />
      <path d="M22 47v12" stroke="currentColor" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LinerGlyph({ size = 56 }: { size?: number }) {
  return (
    <svg width={size * 0.5} height={size} viewBox="0 0 32 64" aria-hidden>
      <rect x="6" y="6" width="20" height="52" rx="10" fill="var(--raise2)" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
      <circle cx="16" cy="30" r="2.5" fill={STAIN} />
      <circle cx="13" cy="36" r="1.5" fill={STAIN} />
    </svg>
  );
}

export function ProductIcon({ product, size = 22 }: { product: Product; size?: number }) {
  switch (product) {
    case 'pad': return <PadGlyph fill={2} size={size} />;
    case 'tampon': return <TamponGlyph fill={2} size={size} />;
    case 'cup': return <CupGlyph level={0.5} size={size} />;
    case 'liner': return <LinerGlyph size={size} />;
  }
}

/** Absorbency tier as color + droplet count, so it reads without color vision too. */
export function Tier({ n, active }: { n: number; active: boolean }) {
  return (
    <span
      className="inline-flex h-10 min-w-12 items-center justify-center gap-[3px] rounded-full px-2.5"
      style={{
        background: active ? `var(--tier-${n})` : 'var(--raise)',
        boxShadow: active ? 'none' : `inset 0 0 0 2px var(--tier-${n})`,
      }}
    >
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} width="7" height="10" viewBox="0 0 7 10" aria-hidden>
          <path d="M3.5 0C2 3 0 4.8 0 6.6a3.5 3.5 0 0 0 7 0C7 4.8 5 3 3.5 0z" fill={active ? '#fff' : `var(--tier-${n})`} />
        </svg>
      ))}
    </span>
  );
}
