import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORIES = [
  { value: "NLP", color: "#0d9488" },
  { value: "Vision par ordinateur", color: "#f97316" },
  { value: "Creation IA", color: "#8b5cf6" },
  { value: "Sante", color: "#ef4444" },
  { value: "Mobilite", color: "#3b82f6" },
  { value: "Education", color: "#eab308" },
  { value: "Environnement", color: "#22c55e" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

export const PROJECT_STATUSES = [
  { value: "open", color: "#22c55e" },
  { value: "in_progress", color: "#3b82f6" },
  { value: "completed", color: "#8b5cf6" },
  { value: "archived", color: "#6b7280" },
] as const;

export const CONTRIBUTION_TYPES = [
  { value: "code", icon: "code" },
  { value: "design", icon: "palette" },
  { value: "research", icon: "search" },
  { value: "testing", icon: "flask" },
  { value: "feedback", icon: "message" },
] as const;

export const MEMBER_ROLES = [
  { value: "creator" },
  { value: "contributor" },
  { value: "tester" },
] as const;

export function getCategoryColor(category: string): string {
  const cat = CATEGORIES.find((c) => c.value === category);
  return cat?.color ?? "#6b7280";
}

export function getCategoryLabel(category: string, translations?: Record<string, string>): string {
  if (translations && translations[category]) return translations[category];
  return category;
}

export function getStatusColor(status: string): string {
  const s = PROJECT_STATUSES.find((st) => st.value === status);
  return s?.color ?? "#6b7280";
}

export function getStatusLabel(status: string, translations?: Record<string, string>): string {
  if (translations && translations[status]) return translations[status];
  return status;
}

export interface TimeTranslations {
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  monthsAgo: string;
}

const defaultTimeStrings: TimeTranslations = {
  justNow: "a l'instant",
  minutesAgo: "il y a {n}min",
  hoursAgo: "il y a {n}h",
  daysAgo: "il y a {n}j",
  monthsAgo: "il y a {n} mois",
};

export function timeAgo(date: Date | string, timeStrings?: TimeTranslations): string {
  const t = timeStrings || defaultTimeStrings;
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return t.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t.minutesAgo.replace("{n}", String(minutes));
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.hoursAgo.replace("{n}", String(hours));
  const days = Math.floor(hours / 24);
  if (days < 30) return t.daysAgo.replace("{n}", String(days));
  const months = Math.floor(days / 30);
  return t.monthsAgo.replace("{n}", String(months));
}

export function formatDate(date: Date | string, locale: string = "fr"): string {
  return new Date(date).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// V6.3: Challenge categories for real-world problems
export const CHALLENGE_CATEGORIES = [
  { value: "Climate", color: "#22c55e" },
  { value: "Healthcare", color: "#ef4444" },
  { value: "Education", color: "#eab308" },
  { value: "Energy", color: "#f97316" },
  { value: "Food", color: "#84cc16" },
  { value: "Cybersecurity", color: "#6366f1" },
  { value: "Democracy", color: "#3b82f6" },
  { value: "Accessibility", color: "#8b5cf6" },
  { value: "AI Safety", color: "#ec4899" },
  { value: "Space & Science", color: "#0d9488" },
] as const;

export type ChallengeCategory = (typeof CHALLENGE_CATEGORIES)[number]["value"];

export function getChallengeCategoryColor(category: string): string {
  const cat = CHALLENGE_CATEGORIES.find((c) => c.value === category);
  return cat?.color ?? "#6b7280";
}
