import { createContext, useContext, type ReactNode } from 'react';
import { useAppStore } from '../stores/appStore';
import { translations, type Lang, type TranslationKey } from './translations';

const I18nContext = createContext<(key: TranslationKey) => string>((key) => key);

export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useAppStore((s) => s.config.language) as Lang;

  const t = (key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry.zh || key;
  };

  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}
