'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export function Section({ title, right, children, className }: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('pt-7', className)}>
      {(title || right) && (
        <div className="flex items-baseline justify-between gap-3 pb-2">
          {title && <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-t3">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Row({ label, sub, children, onClick, className }: {
  label: React.ReactNode;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="truncate">{label}</div>
        {sub && <div className="text-sm text-t3 truncate">{sub}</div>}
      </div>
      {children}
    </>
  );
  const cls = cx('flex min-h-14 w-full items-center gap-3 border-b border-line py-2.5 text-start', className);
  return onClick ? (
    <button onClick={onClick} className={cx(cls, 'press')}>{body}</button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Chip({ on, onClick, children, className, disabled }: {
  on?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={cx(
        'press inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-[15px] whitespace-nowrap',
        on ? 'bg-accent text-on-accent font-semibold' : 'bg-raise text-t1',
        disabled && 'opacity-40',
        className
      )}
    >
      {children}
    </button>
  );
}

export function Seg<T extends string | number>({ options, value, onChange, className }: {
  options: { value: T; label: React.ReactNode }[];
  value: T | undefined;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cx('flex rounded-full bg-raise p-1', className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'press h-9 flex-1 rounded-full px-2 text-[15px] whitespace-nowrap',
            value === o.value ? 'bg-accent text-on-accent font-semibold' : 'text-t2'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Button({ children, onClick, kind = 'primary', className, disabled }: {
  children: React.ReactNode;
  onClick?: () => void;
  kind?: 'primary' | 'quiet' | 'danger';
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'press inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[16px] font-semibold',
        kind === 'primary' && 'bg-accent text-on-accent',
        kind === 'quiet' && 'bg-raise text-t1',
        kind === 'danger' && 'bg-bad text-bg',
        disabled && 'opacity-40',
        className
      )}
    >
      {children}
    </button>
  );
}

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="rise w-full max-w-md rounded-t-[28px] bg-bg px-5 pt-3"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-raise2" />
        {children}
      </div>
    </div>
  );
}

// ── Toast with undo ───────────────────────────────────────────

interface ToastState { id: number; text: string; undo?: () => void }
const ToastCtx = createContext<(text: string, undo?: () => void) => void>(() => {});

export function ToastProvider({ undoLabel, children }: { undoLabel: string; children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string, undo?: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    const id = Date.now();
    setToast({ id, text, undo });
    timer.current = setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 4500);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && (
        <div
          className="no-print pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
          style={{ bottom: 'calc(76px + env(safe-area-inset-bottom))' }}
        >
          <div key={toast.id} className="rise pointer-events-auto flex max-w-md items-center gap-4 rounded-full bg-t1 py-2 ps-5 pe-2 text-bg" role="status">
            <span className="text-[15px]">{toast.text}</span>
            {toast.undo && (
              <button
                className="press h-9 rounded-full px-4 text-[15px] font-semibold"
                style={{ color: 'var(--accent-soft)' }}
                onClick={() => {
                  toast.undo?.();
                  setToast(null);
                }}
              >
                {undoLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

export function buzz() {
  try { navigator.vibrate?.(12); } catch {}
}
