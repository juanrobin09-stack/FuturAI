import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateImpactScore } from "@/lib/impact-score";

export const dynamic = 'force-dynamic';

// GET /api/users?clerkId=xxx OR ?leaderboard=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get("clerkId");
    const leaderboard = searchParams.get("leaderboard");

    // Leaderboard mode: return all users sorted by points
    if (leaderboard === "true") {
      const range = searchParams.get("range");
      let userIds: string[] | undefined;

      // Filter by time range using Activity model
      if (range === "weekly" || range === "monthly") {
        const daysAgo = range === "weekly" ? 7 : 30;
        const since = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        const recentActivities = await prisma.activity.findMany({
          where: { createdAt: { gte: since } },
          select: { userId: true },
          distinct: ["userId"],
        });
        userIds = recentActivities.map((a) => a.userId);
      }

      const country = searchParams.get("country");
      const whereClause: Record<string, unknown> = {
        // Exclude demo/seed users and auto-created placeholders
        AND: [
          { NOT: { email: { endsWith: "@futureai.dev" } } },
          { NOT: { email: { endsWith: "@placeholder.dev" } } },
        ],
      };
      if (userIds) whereClause.id = { in: userIds };
      if (country) whereClause.country = country;

      const users = await prisma.user.findMany({
        where: whereClause,
        orderBy: { points: "desc" },
        take: 50,
        include: {
          _count: {
            select: { ideas: true, contributions: true, projects: true },
          },
        },
      });

      return NextResponse.json({
        users: users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        })),
      });
    }

    if (!clerkId) {
      return NextResponse.json({ error: "clerkId requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        ideas: {
          include: {
            author: { select: { username: true, avatarUrl: true } },
            votes: { select: { value: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        badges: { include: { badge: true } },
        contributions: {
          include: { project: { select: { id: true, title: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        projects: {
          include: { project: { select: { id: true, title: true, status: true } } },
          orderBy: { joinedAt: "desc" },
        },
      },
    });

    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          clerkId,
          username: "User_" + clerkId.slice(-6),
          email: clerkId + "@placeholder.dev",
        },
        include: {
          ideas: true,
          badges: { include: { badge: true } },
          contributions: true,
          projects: true,
        },
      });

      return NextResponse.json({
        ...newUser,
        ideas: [],
        contributions: [],
        projects: [],
        globalRank: 1,
        countryRank: null,
        sandboxSessionCount: 0,
      });
    }

    // Exclude demo/seed users from rank calculations
    const realUserFilter = {
      AND: [
        { NOT: { email: { endsWith: "@futureai.dev" } } },
        { NOT: { email: { endsWith: "@placeholder.dev" } } },
      ],
    };

    // Calculate global rank (number of real users with more points + 1)
    const globalRank = (await prisma.user.count({
      where: { ...realUserFilter, points: { gt: user.points } },
    })) + 1;

    // Calculate country rank if user has a country
    let countryRank: number | null = null;
    if (user.country) {
      countryRank = (await prisma.user.count({
        where: {
          ...realUserFilter,
          country: user.country,
          points: { gt: user.points },
        },
      })) + 1;
    }

    // Count arena (sandbox) sessions
    const sandboxSessionCount = await prisma.sandboxSession.count({
      where: { creatorId: user.id },
    });

    // V6.3: Calculate impact score
    const impactBreakdown = await calculateImpactScore(user.id);

    const ideasWithScores = user.ideas.map((idea) => ({
      ...idea,
      score: idea.votes.reduce((sum, v) => sum + v.value, 0),
      createdAt: idea.createdAt.toISOString(),
      updatedAt: idea.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      ...user,
      ideas: ideasWithScores,
      contributions: user.contributions.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
      projects: user.projects.map((p) => ({
        ...p,
        joinedAt: p.joinedAt.toISOString(),
      })),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      globalRank,
      countryRank,
      sandboxSessionCount,
      impactBreakdown,
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
