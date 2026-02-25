import prisma from "@/lib/prisma";

// Badge definitions: name → check function
// These badges are automatically awarded when thresholds are met
const BADGE_DEFINITIONS: {
  name: string;
  description: string;
  descriptionEn: string;
  icon: string;
  category: string;
  check: (stats: UserStats) => boolean;
}[] = [
  {
    name: "Premier Pas",
    description: "A soumis sa premiere idee",
    descriptionEn: "Submitted their first idea",
    icon: "sparkles",
    category: "engagement",
    check: (s) => s.ideasCount >= 1,
  },
  {
    name: "Collaborateur",
    description: "Membre de 3 projets ou plus",
    descriptionEn: "Member of 3 or more projects",
    icon: "users",
    category: "general",
    check: (s) => s.projectsJoined >= 3,
  },
  {
    name: "Contributeur Actif",
    description: "A realise 10 contributions ou plus",
    descriptionEn: "Made 10 or more contributions",
    icon: "code",
    category: "contribution",
    check: (s) => s.contributionsCount >= 10,
  },
  {
    name: "Voteur Assidu",
    description: "A vote 50 fois ou plus",
    descriptionEn: "Voted 50 or more times",
    icon: "thumbs-up",
    category: "engagement",
    check: (s) => s.votesCount >= 50,
  },
  {
    name: "Challenger",
    description: "A participe a 3 challenges ou plus",
    descriptionEn: "Participated in 3 or more challenges",
    icon: "trophy",
    category: "challenge",
    check: (s) => s.challengeEntriesCount >= 3,
  },
  {
    name: "Expert IA",
    description: "A atteint 1000 points",
    descriptionEn: "Reached 1000 points",
    icon: "award",
    category: "general",
    check: (s) => s.totalPoints >= 1000,
  },
  // V5 Global recognition badges
  {
    name: "Global Builder",
    description: "A construit un projet avec 3+ contributeurs",
    descriptionEn: "Built a project with 3+ contributors",
    icon: "globe",
    category: "contribution",
    check: (s) => s.projectsJoined >= 3 && s.contributionsCount >= 5,
  },
  {
    name: "Top Innovator",
    description: "A atteint le top du classement",
    descriptionEn: "Reached #1 on the leaderboard",
    icon: "crown",
    category: "engagement",
    check: (s) => s.totalPoints >= 2000,
  },
  {
    name: "AI Pioneer",
    description: "A complete un challenge special",
    descriptionEn: "First to complete a special challenge",
    icon: "rocket",
    category: "challenge",
    check: (s) => s.challengeEntriesCount >= 1 && s.totalPoints >= 500,
  },
  {
    name: "Challenge Champion",
    description: "A participe a 5+ challenges",
    descriptionEn: "Won 3+ challenges",
    icon: "trophy",
    category: "challenge",
    check: (s) => s.challengeEntriesCount >= 5,
  },
  {
    name: "Open Contributor",
    description: "A contribue a 5+ projets differents",
    descriptionEn: "Contributed to 5+ different projects",
    icon: "git-merge",
    category: "contribution",
    check: (s) => s.projectsJoined >= 5,
  },
  // V8: Network badges
  {
    name: "Networker",
    description: "A 5 connexions ou plus",
    descriptionEn: "Has 5 or more connections",
    icon: "users",
    category: "engagement",
    check: (s) => s.connectionsCount >= 5,
  },
  {
    name: "Mentor",
    description: "A recommande 10 competences ou plus",
    descriptionEn: "Endorsed 10 or more skills",
    icon: "heart-handshake",
    category: "engagement",
    check: (s) => s.endorsementsGiven >= 10,
  },
  {
    name: "Reconnu",
    description: "A recu 10 recommandations ou plus",
    descriptionEn: "Received 10 or more endorsements",
    icon: "star",
    category: "engagement",
    check: (s) => s.endorsementsReceived >= 10,
  },
];

interface UserStats {
  ideasCount: number;
  projectsJoined: number;
  contributionsCount: number;
  votesCount: number;
  challengeEntriesCount: number;
  totalPoints: number;
  connectionsCount: number;
  endorsementsGiven: number;
  endorsementsReceived: number;
}

/**
 * Check and award badges for a user based on their current stats.
 * Returns the names of newly awarded badges.
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  try {
    // Gather user stats in parallel
    const [
      ideasCount,
      projectsJoined,
      contributionsCount,
      votesCount,
      challengeEntriesCount,
      user,
      connectionsSent,
      connectionsReceived,
      endorsementsGiven,
      endorsementsReceived,
    ] = await Promise.all([
      prisma.idea.count({ where: { authorId: userId } }),
      prisma.projectMember.count({ where: { userId } }),
      prisma.contribution.count({ where: { userId } }),
      prisma.vote.count({ where: { userId } }),
      prisma.challengeEntry.count({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { points: true } }),
      prisma.connection.count({ where: { requesterId: userId, status: "accepted" } }),
      prisma.connection.count({ where: { receiverId: userId, status: "accepted" } }),
      prisma.profileEndorsement.count({ where: { endorserId: userId } }),
      prisma.profileEndorsement.count({ where: { endorseeId: userId } }),
    ]);

    if (!user) return [];

    const stats: UserStats = {
      ideasCount,
      projectsJoined,
      contributionsCount,
      votesCount,
      challengeEntriesCount,
      totalPoints: user.points,
      connectionsCount: connectionsSent + connectionsReceived,
      endorsementsGiven,
      endorsementsReceived,
    };

    // Get user's existing badges
    const existingBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: { select: { name: true } } },
    });
    const existingBadgeNames = new Set(existingBadges.map((ub) => ub.badge.name));

    const newlyAwarded: string[] = [];

    for (const def of BADGE_DEFINITIONS) {
      // Skip if already awarded
      if (existingBadgeNames.has(def.name)) continue;

      // Check if the user meets the threshold
      if (!def.check(stats)) continue;

      // Upsert the badge definition (in case it doesn't exist in DB yet)
      const badge = await prisma.badge.upsert({
        where: { name: def.name },
        update: {},
        create: {
          name: def.name,
          description: def.description,
          icon: def.icon,
          category: def.category,
        },
      });

      // Award to user
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          type: "badge",
          title: "Nouveau badge !",
          message: `Vous avez obtenu le badge "${def.name}"`,
          link: "/profile",
          userId,
        },
      });

      // Log activity for real-time feed
      await prisma.activity.create({
        data: {
          type: "badge",
          message: `earned badge "${def.name}"`,
          metadata: JSON.stringify({ badgeName: def.name, badgeIcon: def.icon }),
          userId,
        },
      }).catch(() => {});

      newlyAwarded.push(def.name);
    }

    return newlyAwarded;
  } catch (error) {
    console.error("checkAndAwardBadges error:", error);
    return [];
  }
}
