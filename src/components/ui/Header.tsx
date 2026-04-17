interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center">
        <span className="text-lg font-bold text-pink-600">{title}</span>
      </div>
    </header>
  );
}
