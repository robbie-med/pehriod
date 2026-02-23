import { Icons } from './Icons';

interface HeaderProps {
  title: string;
  onSettingsClick: () => void;
}

export function Header({ title, onSettingsClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <button
          onClick={onSettingsClick}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Settings"
        >
          <Icons.Globe />
        </button>
      </div>
    </header>
  );
}
