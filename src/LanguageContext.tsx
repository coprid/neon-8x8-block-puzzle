import { createContext, useContext, useState, ReactNode } from 'react';
import { Lang, TranslationKey, translations } from './translations';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

function detectBrowserLang(): Lang {
  const raw = navigator.language || 'en';
  return raw.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function getStoredLang(): Lang | null {
  try {
    const stored = localStorage.getItem('blockpuzzle_lang');
    if (stored === 'ru' || stored === 'en') return stored;
  } catch { /* silent */ }
  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getStoredLang() ?? detectBrowserLang());

  const setLang = (next: Lang) => {
    setLangState(next);
    try { localStorage.setItem('blockpuzzle_lang', next); } catch { /* silent */ }
  };

  const t = (key: TranslationKey): string => translations[lang][key];

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}