'use client';

import { BleedEntry, BleedKind, Fill, Product } from '../../lib/types';
import { Prefs } from '../../lib/storage';
import { CUP_CAPACITIES_ML, CUP_FRACTIONS, PBAC_HEAVY, TAMPON_TIERS, summarize } from '../../lib/pbac';
import { T } from '../../data/translations';
import { Chip, cx } from '../ui/kit';
import { CupGlyph, LinerGlyph, PadGlyph, ProductIcon, TamponGlyph, Tier } from './Glyphs';

interface Props {
  t: T;
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
  onLog: (e: Omit<BleedEntry, 'id' | 'ts'>) => void;
  onRemove: (e: BleedEntry) => void;
  todayEntries: BleedEntry[];
  periodEntries: BleedEntry[];
}

const PRODUCTS: Product[] = ['pad', 'tampon', 'cup', 'liner'];
const FILLS: Fill[] = [1, 2, 3];

export function describeEntry(t: T, e: BleedEntry): string {
  switch (e.kind) {
    case 'pad':
    case 'tampon':
      return `${t[`product_${e.kind}`]} · ${t[`fill_${e.fill ?? 2}` as 'fill_1']}`;
    case 'cup': return `${t.product_cup} · ${e.ml} mL`;
    case 'liner': return t.spotting;
    case 'clot': return e.big ? t.clot_large : t.clot_small;
    case 'flood': return t.flood;
  }
}

function EntryMark({ e }: { e: BleedEntry }) {
  if (e.kind === 'pad') return <PadGlyph fill={e.fill ?? 2} size={22} />;
  if (e.kind === 'tampon') return <TamponGlyph fill={e.fill ?? 2} size={22} />;
  if (e.kind === 'cup') return <CupGlyph level={0.6} size={22} />;
  if (e.kind === 'liner') return <LinerGlyph size={22} />;
  return <span className="inline-block rounded-full" style={{ width: e.big ? 12 : 7, height: e.big ? 12 : 7, background: 'var(--flow-heavy)' }} />;
}

export function BleedLogger({ t, prefs, setPrefs, onLog, onRemove, todayEntries, periodEntries }: Props) {
  const product = prefs.product;
  const size = product === 'liner' ? 0 : prefs.size[product];
  const score = summarize(periodEntries);
  const time = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const log = (kind: BleedKind, extra: Partial<BleedEntry> = {}) => onLog({ kind, ...extra });

  return (
    <div>
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-raise p-1">
        {PRODUCTS.map((p) => (
          <button
            key={p}
            onClick={() => setPrefs({ product: p })}
            aria-pressed={product === p}
            className={cx(
              'press flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[13px]',
              product === p ? 'bg-bg font-semibold text-t1' : 'text-t2'
            )}
          >
            <ProductIcon product={p} size={20} />
            {t[`product_${p}`]}
          </button>
        ))}
      </div>

      {(product === 'pad' || product === 'tampon') && (
        <div className="mt-3">
          <div className="flex justify-between gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className="press"
                aria-label={product === 'tampon' ? t[`tampon_${TAMPON_TIERS[n - 1].key}`] : `${n}/5`}
                aria-pressed={size === n}
                onClick={() => setPrefs({ size: { ...prefs.size, [product]: n } })}
              >
                <Tier n={n} active={size === n} />
              </button>
            ))}
          </div>
          {product === 'tampon' && (
            <p className="mt-1.5 text-center text-sm text-t3">
              {t[`tampon_${TAMPON_TIERS[size - 1].key}`]} · {size === 1 ? '≤' : `${TAMPON_TIERS[size - 2].maxG}–`}{TAMPON_TIERS[size - 1].maxG} g
            </p>
          )}
        </div>
      )}

      {product === 'cup' && (
        <div className="mt-3 flex justify-between gap-1.5">
          {CUP_CAPACITIES_ML.map((ml, i) => (
            <Chip key={ml} on={size === i + 1} onClick={() => setPrefs({ size: { ...prefs.size, cup: i + 1 } })} className="flex-1 px-0">
              <span className="num">{ml}</span>
            </Chip>
          ))}
        </div>
      )}

      <div className={cx('mt-3 grid gap-2', product === 'cup' ? 'grid-cols-4' : product === 'liner' ? 'grid-cols-1' : 'grid-cols-3')}>
        {(product === 'pad' || product === 'tampon') &&
          FILLS.map((f) => (
            <button
              key={f}
              onClick={() => log(product, { size, fill: f })}
              className="press flex h-32 flex-col items-center justify-center gap-2 rounded-2xl bg-raise text-t2"
            >
              {product === 'pad' ? <PadGlyph fill={f} size={60} /> : <TamponGlyph fill={f} size={60} />}
              <span className="text-[15px] font-semibold text-t1">{t[`fill_${f}` as 'fill_1']}</span>
            </button>
          ))}
        {product === 'cup' &&
          CUP_FRACTIONS.map((fr) => {
            const ml = Math.round(CUP_CAPACITIES_ML[size - 1] * fr);
            return (
              <button
                key={fr}
                onClick={() => log('cup', { ml })}
                className="press flex h-32 flex-col items-center justify-center gap-2 rounded-2xl bg-raise text-t2"
              >
                <CupGlyph level={fr} size={52} />
                <span className="num text-[15px] font-semibold text-t1">{ml}</span>
              </button>
            );
          })}
        {product === 'liner' && (
          <button onClick={() => log('liner')} className="press flex h-24 items-center justify-center gap-4 rounded-2xl bg-raise text-t2">
            <LinerGlyph size={52} />
            <span className="text-[17px] font-semibold text-t1">{t.spotting}</span>
          </button>
        )}
      </div>

      <div className="mt-2 flex gap-2">
        <Chip onClick={() => log('clot', { big: false })} className="flex-1 px-2">{t.clot_small}</Chip>
        <Chip onClick={() => log('clot', { big: true })} className="flex-1 px-2">{t.clot_large}</Chip>
        <Chip onClick={() => log('flood')} className="flex-1 px-2">{t.flood}</Chip>
      </div>

      {(todayEntries.length > 0 || score.score > 0 || score.ml > 0) && (
        <div className="mt-3 flex items-center gap-3">
          <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
            {todayEntries.map((e) => (
              <button
                key={e.id}
                onClick={() => onRemove(e)}
                aria-label={`${describeEntry(t, e)} ${time(e.ts)}`}
                className="press flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-raise ps-2 pe-3 text-sm text-t2"
              >
                <EntryMark e={e} />
                <span className="num">{time(e.ts)}</span>
              </button>
            ))}
          </div>
          <div className="shrink-0 text-end leading-tight">
            <div className={cx('num text-xl font-bold', score.score >= PBAC_HEAVY ? 'text-bad' : 'text-t1')}>
              {score.score}
              <span className="text-sm font-normal text-t3">/{PBAC_HEAVY}</span>
            </div>
            {score.ml > 0 && <div className="num text-sm text-t3">{score.ml} mL</div>}
          </div>
        </div>
      )}
    </div>
  );
}
