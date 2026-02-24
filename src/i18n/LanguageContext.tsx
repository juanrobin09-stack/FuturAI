"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { fr, type TranslationKeys } from "./translations/fr";
import { en } from "./translations/en";

export type Locale = "fr" | "en";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const translations: Record<Locale, TranslationKeys> = { fr, en };

function getInitialLocale(): Locale {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|; )locale=(\w+)/);
    if (match && (match[1] === "fr" || match[1] === "en")) return match[1] as Locale;
  }
  if (typeof navigator !== "undefined") {
    const browserLang = navigator.language.slice(0, 2);
    if (browserLang === "fr") return "fr";
  }
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60}`;
    document.documentElement.lang = newLocale;
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
