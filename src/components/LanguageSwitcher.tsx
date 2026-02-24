"use client";

import { useLanguage } from "@/i18n";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const router = useRouter();

  const toggle = () => {
    const next = locale === "fr" ? "en" : "fr";
    setLocale(next);
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-white/5 hover:border-white/20"
      title={locale === "fr" ? "Switch to English" : "Passer en francais"}
    >
      <Globe className="w-4 h-4" />
      <span className="text-xs font-bold uppercase">{locale === "fr" ? "EN" : "FR"}</span>
    </button>
  );
}
