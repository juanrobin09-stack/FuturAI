// Points system for gamification
export const POINTS = {
  CREATE_IDEA: 10,
  CREATE_PROJECT: 25,
  CONTRIBUTE_CODE: 15,
  CONTRIBUTE_DESIGN: 15,
  CONTRIBUTE_RESEARCH: 10,
  CONTRIBUTE_TESTING: 10,
  CONTRIBUTE_FEEDBACK: 5,
  VOTE: 1,
  RECEIVE_VOTE: 2,
  COMMENT: 3,
  JOIN_PROJECT: 5,
  SUBMIT_CHALLENGE: 20,
  WIN_CHALLENGE: 100,
  SANDBOX_GENERATE: 5,
  SHARE_SANDBOX: 3,
  SEND_CONNECTION: 2,
  ACCEPT_CONNECTION: 3,
  ENDORSE_USER: 1,
  RECEIVE_ENDORSEMENT: 2,
  CREATE_FORUM_THREAD: 8,
  FORUM_POST: 3,
  // Engagement
  DAILY_LOGIN: 5,
  STREAK_BONUS_7: 50,
  STREAK_BONUS_30: 200,
  PROFILE_COMPLETE: 50,
  SHARE_CONTENT: 3,
} as const;

export function getContributionPoints(type: string): number {
  switch (type) {
    case "code": return POINTS.CONTRIBUTE_CODE;
    case "design": return POINTS.CONTRIBUTE_DESIGN;
    case "research": return POINTS.CONTRIBUTE_RESEARCH;
    case "testing": return POINTS.CONTRIBUTE_TESTING;
    case "feedback": return POINTS.CONTRIBUTE_FEEDBACK;
    default: return 5;
  }
}

const defaultLevelNames: Record<number, string> = {
  1: "Debutant",
  2: "Contributeur",
  3: "Innovateur",
  4: "Architecte IA",
  5: "Expert IA",
};

export function getLevelFromPoints(
  points: number,
  levelNames?: Record<number, string>
): { level: number; title: string; nextThreshold: number } {
  const names = levelNames || defaultLevelNames;
  if (points >= 1000) return { level: 5, title: names[5], nextThreshold: 2000 };
  if (points >= 500) return { level: 4, title: names[4], nextThreshold: 1000 };
  if (points >= 200) return { level: 3, title: names[3], nextThreshold: 500 };
  if (points >= 50) return { level: 2, title: names[2], nextThreshold: 200 };
  return { level: 1, title: names[1], nextThreshold: 50 };
}
