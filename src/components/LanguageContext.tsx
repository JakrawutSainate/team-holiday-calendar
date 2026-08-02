'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Language, translations } from '../libs/i18n';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hq-lang') as Language;
      if (saved && (saved === 'en' || saved === 'th')) return saved;
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hq-lang', lang);
    }
  }, []);

  const t = useCallback((key: keyof typeof translations['en']): string => {
    const translation = translations[language]?.[key];
    return translation || translations['en'][key] || String(key);
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
