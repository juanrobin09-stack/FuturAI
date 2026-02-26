/**
 * Events / Sessions configuration
 *
 * Edit this file to add, update, or remove upcoming sessions.
 * Past events are automatically moved to the "past" section based on date.
 */

export interface FutureAIEvent {
  id: string;
  title: {
    fr: string;
    en: string;
  };
  description: {
    fr: string;
    en: string;
  };
  /** ISO date string, e.g. "2026-03-06T20:00:00" */
  date: string;
  /** Duration in minutes */
  duration: number;
  /** Max number of spots (null = unlimited) */
  maxSpots: number | null;
  /** External link to join (Google Meet, Zoom, Discord, X Space...) */
  joinUrl: string;
  /** Platform used */
  platform: "google-meet" | "zoom" | "discord" | "x-space" | "youtube" | "other";
  /** Host name */
  host: string;
  /** Format */
  format: "online" | "in-person";
  /** Tags for display */
  tags: string[];
  /** Whether the event is free */
  free: boolean;
}

// ============================================================
// ADD YOUR EVENTS BELOW
// ============================================================

export const EVENTS: FutureAIEvent[] = [
  {
    id: "session-001",
    title: {
      fr: "Comment j'ai construit seul une plateforme de gouvernance IA",
      en: "How I built an AI governance platform solo",
    },
    description: {
      fr: "Session intime de 30 min. Je partage mon parcours de fondateur solo : les choix techniques, les erreurs, et pourquoi la gouvernance IA est le prochain grand sujet. Q&A ouvert.",
      en: "Intimate 30-min session. I share my solo founder journey: technical choices, mistakes, and why AI governance is the next big topic. Open Q&A.",
    },
    date: "2026-03-06T20:00:00",
    duration: 40,
    maxSpots: 20,
    joinUrl: "",
    platform: "google-meet",
    host: "Juan R. - Fondateur FutureAI",
    format: "online",
    tags: ["Fondateur", "Gouvernance IA", "Solo Builder"],
    free: true,
  },
  {
    id: "session-002",
    title: {
      fr: "Demo live : l'Arena IA - 3 modeles s'affrontent en direct",
      en: "Live demo: AI Arena - 3 models compete head-to-head",
    },
    description: {
      fr: "Je lance un prompt, 3 providers IA repondent en direct. On compare, on debat, on vote ensemble. Venez avec vos propres prompts !",
      en: "I launch a prompt, 3 AI providers respond live. We compare, debate, and vote together. Bring your own prompts!",
    },
    date: "2026-03-13T20:00:00",
    duration: 45,
    maxSpots: 30,
    joinUrl: "",
    platform: "zoom",
    host: "Juan R. - Fondateur FutureAI",
    format: "online",
    tags: ["Arena", "Demo live", "IA"],
    free: true,
  },
  {
    id: "session-003",
    title: {
      fr: "Pourquoi l'IA a besoin de regles - et comment je les construis",
      en: "Why AI needs rules - and how I'm building them",
    },
    description: {
      fr: "L'IA sans gouvernance, c'est dangereux. Je montre comment FutureAI integre audit logs, panels d'experts, scoring transparent. Discussion ouverte.",
      en: "AI without governance is dangerous. I show how FutureAI integrates audit logs, expert panels, transparent scoring. Open discussion.",
    },
    date: "2026-03-20T20:00:00",
    duration: 35,
    maxSpots: 20,
    joinUrl: "",
    platform: "discord",
    host: "Juan R. - Fondateur FutureAI",
    format: "online",
    tags: ["Gouvernance", "Ethique IA", "Transparence"],
    free: true,
  },
  {
    id: "session-004",
    title: {
      fr: "AMA - IA, entrepreneuriat et vision du futur",
      en: "AMA - AI, entrepreneurship and future vision",
    },
    description: {
      fr: "Posez-moi toutes vos questions. On parle IA, construction de projet, ambition, et comment faire vivre le monde avec la tech.",
      en: "Ask me anything. We talk AI, project building, ambition, and how to impact the world through tech.",
    },
    date: "2026-03-27T20:00:00",
    duration: 60,
    maxSpots: null,
    joinUrl: "",
    platform: "x-space",
    host: "Juan R. - Fondateur FutureAI",
    format: "online",
    tags: ["AMA", "Entrepreneuriat", "Vision"],
    free: true,
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getUpcomingEvents(): FutureAIEvent[] {
  const now = new Date();
  return EVENTS.filter((e) => {
    const eventEnd = new Date(e.date);
    eventEnd.setMinutes(eventEnd.getMinutes() + e.duration);
    return eventEnd > now;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getPastEvents(): FutureAIEvent[] {
  const now = new Date();
  return EVENTS.filter((e) => {
    const eventEnd = new Date(e.date);
    eventEnd.setMinutes(eventEnd.getMinutes() + e.duration);
    return eventEnd <= now;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function isEventLive(event: FutureAIEvent): boolean {
  const now = new Date();
  const start = new Date(event.date);
  const end = new Date(event.date);
  end.setMinutes(end.getMinutes() + event.duration);
  return now >= start && now <= end;
}

export function getPlatformLabel(platform: FutureAIEvent["platform"]): string {
  const labels: Record<string, string> = {
    "google-meet": "Google Meet",
    zoom: "Zoom",
    discord: "Discord",
    "x-space": "X Space",
    youtube: "YouTube Live",
    other: "Lien externe",
  };
  return labels[platform] || platform;
}

export function getPlatformIcon(platform: FutureAIEvent["platform"]): string {
  const icons: Record<string, string> = {
    "google-meet": "🟢",
    zoom: "🔵",
    discord: "🟣",
    "x-space": "⚫",
    youtube: "🔴",
    other: "🔗",
  };
  return icons[platform] || "🔗";
}
