import { Language, languages } from '../../data/translations';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  title: string;
}

export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  title,
}: LanguageSelectorProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.keys(languages) as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => onLanguageChange(lang)}
            className={`p-3 rounded-lg text-left border transition-all ${
              currentLanguage === lang
                ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-500'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {languages[lang].name}
          </button>
        ))}
      </div>
    </div>
  );
}
