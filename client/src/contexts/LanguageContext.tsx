/**
 * LanguageContext — English-only runtime.
 * Arabic support has been removed from the UI. The hook API and types are
 * preserved so existing components compile without modification.
 * All runtime values are fixed to English / LTR.
 */
import React, { createContext, useContext, useEffect } from "react";
import { translations, type Lang, type TranslationKey } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always English, always LTR — language switching is disabled
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", "ltr");
    html.setAttribute("lang", "en");
    html.classList.remove("font-arabic");
  }, []);

  const t = (key: TranslationKey): string => {
    return (translations.en as Record<string, string>)[key] ?? key;
  };

  const value: LanguageContextValue = {
    lang: "en" as Lang,
    setLang: () => {}, // no-op — language switching disabled
    t,
    isRTL: false,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
