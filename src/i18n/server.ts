import { cookies } from "next/headers";
import { fr, type TranslationKeys } from "./translations/fr";
import { en } from "./translations/en";
import type { Locale } from "./LanguageContext";

export function getServerLocale(): Locale {
  try {
    const cookieStore = cookies();
    const locale = cookieStore.get("locale")?.value;
    return locale === "fr" ? "fr" : "en";
  } catch {
    return "en";
  }
}

export function getServerTranslations(): { t: TranslationKeys; locale: Locale } {
  const locale = getServerLocale();
  return { t: locale === "en" ? en : fr, locale };
}
