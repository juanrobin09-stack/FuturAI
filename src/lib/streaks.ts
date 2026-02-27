import prisma from "@/lib/prisma";
import { POINTS } from "@/lib/points";
import { checkAndAwardBadges } from "@/lib/badges";

interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  pointsAwarded: number;
  isNewDay: boolean;
}

/**
 * Update login streak for a user.
 * Called once per API request to /api/users/me (GET).
 * Compares dates in UTC to detect new calendar days.
 */
export async function updateLoginStreak(userId: string): Promise<StreakResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastLoginAt: true,
      currentStreak: true,
      longestStreak: true,
      points: true,
    },
  });

  if (!user) {
    return { currentStreak: 0, longestStreak: 0, pointsAwarded: 0, isNewDay: false };
  }

  const now = new Date();
  const todayUTC = toUTCDate(now);

  // If user logged in today already, no-op
  if (user.lastLoginAt) {
    const lastUTC = toUTCDate(user.lastLoginAt);
    if (lastUTC === todayUTC) {
      return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        pointsAwarded: 0,
        isNewDay: false,
      };
    }
  }

  // Determine new streak
  let newStreak: number;
  if (user.lastLoginAt) {
    const lastUTC = toUTCDate(user.lastLoginAt);
    const yesterdayUTC = toUTCDate(new Date(now.getTime() - 86400000));
    if (lastUTC === yesterdayUTC) {
      // Consecutive day
      newStreak = user.currentStreak + 1;
    } else {
      // Gap > 1 day, reset
      newStreak = 1;
    }
  } else {
    // First login ever
    newStreak = 1;
  }

  const newLongest = Math.max(user.longestStreak, newStreak);

  // Calculate bonus points
  let totalPoints = POINTS.DAILY_LOGIN; // 5 pts base
  if (newStreak === 7) totalPoints += POINTS.STREAK_BONUS_7;   // +50
  if (newStreak === 30) totalPoints += POINTS.STREAK_BONUS_30; // +200

  // Single atomic update
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: now,
      currentStreak: newStreak,
      longestStreak: newLongest,
      points: { increment: totalPoints },
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      type: "login",
      message: `logged in (streak: ${newStreak} days)`,
      metadata: JSON.stringify({ streak: newStreak, points: totalPoints }),
      userId,
    },
  }).catch(() => {});

  // Check badges (async, non-blocking)
  checkAndAwardBadges(userId).catch(() => {});

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    pointsAwarded: totalPoints,
    isNewDay: true,
  };
}

/** Convert Date to YYYY-MM-DD UTC string for comparison */
function toUTCDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
