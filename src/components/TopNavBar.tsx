'use client';

import { useTranslation } from './LanguageContext';

interface TopNavBarProps {
  onSearch?: (term: string) => void;
  placeholder?: string;
}

export default function TopNavBar({ onSearch, placeholder }: TopNavBarProps) {
  const { language, setLanguage, t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-12 w-full h-16 border-b border-outline-variant bg-white/85 backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            className="w-full bg-surface-container-low border border-outline-variant rounded-full pl-10 pr-4 py-1.5 font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-outline text-on-surface"
            placeholder={placeholder || t('searchPlaceholder')}
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">{t('dashboard')}</a>
          <a href="#" className="text-primary border-b-2 border-primary pb-1 text-sm font-semibold">{t('team')}</a>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">{t('policy')}</a>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">{t('insights')}</a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-outline-variant text-primary hover:bg-surface-container transition-colors cursor-pointer"
            title="Toggle language"
          >
            {language === 'en' ? 'TH' : 'EN'}
          </button>

          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary p-2 transition-colors">
            notifications
          </button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary p-2 transition-colors">
            help_outline
          </button>
        </div>
        <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer">
          {t('requestLeave')}
        </button>
      </div>
    </header>
  );
}
