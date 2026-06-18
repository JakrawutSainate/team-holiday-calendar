'use client';

import { useAuth } from './AuthContext';
import { useTranslation } from './LanguageContext';

interface TopNavBarProps {
  onSearch?: (term: string) => void;
  placeholder?: string;
}

export default function TopNavBar({ onSearch, placeholder }: TopNavBarProps) {
  const { language, setLanguage, t } = useTranslation();
  const { user } = useAuth();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 lg:px-12 w-full h-16 border-b border-zinc-100 bg-white/85 backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-6 flex-1">
        {/* Removed search input and navigation links */}
      </div>

      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
          title="Toggle language"
        >
          {language === 'en' ? 'TH' : 'EN'}
        </button>

        {user && (
          <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer">
            {t('requestLeave')}
          </button>
        )}
      </div>
    </header>
  );
}
