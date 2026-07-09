import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import {
  TRANSLATIONS,
  type Language,
  type Translation,
} from './translations';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
}

const LanguageContext = createContext<LanguageState | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'app-language';
// 기본 언어는 한국어.
const DEFAULT_LANGUAGE: Language = 'ko';

function isLanguage(value: unknown): value is Language {
  return value === 'ko' || value === 'en' || value === 'ja';
}

function getStoredLanguage(): Language {
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    getStoredLanguage(),
  );

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t: TRANSLATIONS[language] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): LanguageState {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useI18n must be used within a LanguageProvider');
  }
  return ctx;
}
