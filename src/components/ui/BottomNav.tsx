import { Icons } from './Icons';

export type TabType = 'tracker' | 'education' | 'meds' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  labels: {
    tracker: string;
    education: string;
    meds: string;
  };
}

export function BottomNav({ activeTab, onTabChange, labels }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center text-xs font-medium text-gray-500 safe-area-inset-bottom">
      <button
        onClick={() => onTabChange('tracker')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          activeTab === 'tracker' ? 'text-pink-600' : 'hover:text-gray-700'
        }`}
        aria-label={labels.tracker}
      >
        <Icons.Clock />
        <span>{labels.tracker}</span>
      </button>
      <button
        onClick={() => onTabChange('education')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          activeTab === 'education' ? 'text-pink-600' : 'hover:text-gray-700'
        }`}
        aria-label={labels.education}
      >
        <Icons.Book />
        <span>{labels.education}</span>
      </button>
      <button
        onClick={() => onTabChange('meds')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          activeTab === 'meds' ? 'text-pink-600' : 'hover:text-gray-700'
        }`}
        aria-label={labels.meds}
      >
        <Icons.Pill />
        <span>{labels.meds}</span>
      </button>
    </nav>
  );
}
