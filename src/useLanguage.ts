import { useState, useCallback } from 'react';
import { translations, Lang, TranslationKey } from './translations';

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

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>(() => getStoredLang() ?? detectBrowserLang());

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try { localStorage.setItem('blockpuzzle_lang', next); } catch { /* silent */ }
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[lang][key];
  }, [lang]);

  return { lang, setLang, t };
}