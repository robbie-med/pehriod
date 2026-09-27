import { BookOpen, CalendarDays, ClipboardList, Droplet, Pill } from 'lucide-react';
import { cx } from './kit';

export type TabType = 'today' | 'cycle' | 'meds' | 'visit' | 'guide';

const TABS: { id: TabType; Icon: typeof Droplet }[] = [
  { id: 'today', Icon: Droplet },
  { id: 'cycle', Icon: CalendarDays },
  { id: 'meds', Icon: Pill },
  { id: 'visit', Icon: ClipboardList },
  { id: 'guide', Icon: BookOpen },
];

export function BottomNav({ active, onChange, labels }: {
  active: TabType | null;
  onChange: (tab: TabType) => void;
  labels: Record<TabType, string>;
}) {
  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map(({ id, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={active === id ? 'page' : undefined}
            className={cx('press flex h-16 flex-col items-center justify-center gap-1 text-[12px]', active === id ? 'text-accent font-semibold' : 'text-t3')}
          >
            <Icon size={22} strokeWidth={active === id ? 2.4 : 1.8} />
            <span className="max-w-full truncate px-1">{labels[id]}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
