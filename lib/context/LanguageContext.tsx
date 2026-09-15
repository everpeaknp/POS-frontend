"use client";

import React, { createContext, useContext } from 'react';
import { useAppearance } from '@/lib/context/AppearanceContext';
import { t, type Language } from '@/lib/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { preferences, updatePreferences } = useAppearance();
  const language = (preferences.language as Language) || 'en';

  const setLanguage = async (lang: Language) => {
    try {
      await updatePreferences({ language: lang });
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  const translate = (key: string) => t(key, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

export function useLanguageOptional() {
  return useContext(LanguageContext);
}
