import { Icons } from './Icons';

export type TabType = 'today' | 'cycle' | 'meds' | 'guide' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  labels: Record<TabType, string>;
}

const TABS: { id: TabType; icon: keyof typeof Icons }[] = [
  { id: 'today', icon: 'Today' },
  { id: 'cycle', icon: 'Cycle' },
  { id: 'meds', icon: 'Pill' },
  { id: 'guide', icon: 'Book' },
  { id: 'settings', icon: 'Settings' },
];

export function BottomNav({ activeTab, onTabChange, labels }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center text-xs font-medium text-gray-500" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      {TABS.map(({ id, icon }) => {
        const Icon = Icons[icon];
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 transition-colors min-w-0 ${
              active ? 'text-pink-600' : 'hover:text-gray-700'
            }`}
          >
            <Icon />
            <span className="truncate">{labels[id]}</span>
          </button>
        );
      })}
    </nav>
  );
}
