import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

export const dynamic = 'force-dynamic';

// GET /api/user/data-export — Export all user data as JSON (GDPR Article 20)
export async function GET(req: NextRequest) {
  try {
    // Rate limit (auth tier — sensitive data export)
    const blocked = applyRateLimit(req, "auth");
    if (blocked) return blocked;

    const user = await getCurrentUser();

    const [
      ideas,
      votes,
      contributions,
      projectMemberships,
      comments,
      badges,
      challengeEntries,
      notifications,
      sandboxSessions,
      activities,
    ] = await Promise.all([
      prisma.idea.findMany({ where: { authorId: user.id } }),
      prisma.vote.findMany({ where: { userId: user.id } }),
      prisma.contribution.findMany({ where: { userId: user.id } }),
      prisma.projectMember.findMany({
        where: { userId: user.id },
        include: { project: { select: { id: true, title: true } } },
      }),
      prisma.comment.findMany({ where: { userId: user.id } }),
      prisma.userBadge.findMany({
        where: { userId: user.id },
        include: { badge: true },
      }),
      prisma.challengeEntry.findMany({ where: { userId: user.id } }),
      prisma.notification.findMany({ where: { userId: user.id } }),
      prisma.sandboxSession.findMany({
        where: { creatorId: user.id },
        include: { versions: true },
      }),
      prisma.activity.findMany({ where: { userId: user.id } }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      dataCategories: [
        "profile", "ideas", "votes", "contributions", "projects",
        "comments", "badges", "challengeEntries", "notifications",
        "arenaSessions", "activities",
      ],
      profile: {
        id: user.id,
        username: user.username,
        email: user.email,
        country: user.country,
        bio: user.bio,
        points: user.points,
        consentGiven: user.consentGiven,
        consentAt: user.consentAt,
        createdAt: user.createdAt,
      },
      ideas,
      votes,
      contributions,
      projects: projectMemberships,
      comments,
      badges,
      challengeEntries,
      notifications,
      arenaSessions: sandboxSessions,
      activities,
    };

    // Audit log — data export (GDPR compliance)
    await createAuditLog({
      action: "data_export",
      targetType: "export",
      targetId: user.id,
      performedById: user.id,
    });

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="futureai-data-export-${user.id}.json"`,
      },
    });
  } catch (error) {
    console.error("GET /api/user/data-export error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
