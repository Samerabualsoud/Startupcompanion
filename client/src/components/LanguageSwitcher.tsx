import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-secondary/60 text-muted-foreground hover:text-foreground border border-border"
      title={lang === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
      aria-label="Toggle language"
    >
      <Globe className="w-3.5 h-3.5 shrink-0" />
      {!compact && (
        <span>{lang === "en" ? "العربية" : "English"}</span>
      )}
    </button>
  );
}
