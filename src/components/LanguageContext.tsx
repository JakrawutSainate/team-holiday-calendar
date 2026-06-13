'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../libs/i18n';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language preference from local storage if available
  useEffect(() => {
    const saved = localStorage.getItem('hq-lang') as Language;
    if (saved === 'en' || saved === 'th') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('hq-lang', lang);
  };

  const t = (key: keyof typeof translations['en']): string => {
    const translation = translations[language][key];
    return translation || translations['en'][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
