import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POINTS } from "@/lib/points";
import { checkAndAwardBadges } from "@/lib/badges";

const VALID_SKILLS = ["ai", "code", "design", "research", "leadership"];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const endorsements = await prisma.profileEndorsement.findMany({
      where: { endorseeId: userId },
      include: {
        endorser: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Group by skill
    const bySkill: Record<string, { count: number; endorsers: { id: string; username: string; avatarUrl: string | null }[] }> = {};
    for (const skill of VALID_SKILLS) {
      bySkill[skill] = { count: 0, endorsers: [] };
    }
    for (const e of endorsements) {
      if (!bySkill[e.skill]) bySkill[e.skill] = { count: 0, endorsers: [] };
      bySkill[e.skill].count++;
      bySkill[e.skill].endorsers.push(e.endorser);
    }

    return NextResponse.json({ endorsements: bySkill, total: endorsements.length });
  } catch (error) {
    console.error("GET /api/network/endorsements error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const { endorseeId, skill } = await req.json();

    if (!endorseeId || !skill || !VALID_SKILLS.includes(skill)) {
      return NextResponse.json({ error: "Invalid endorseeId or skill" }, { status: 400 });
    }

    if (endorseeId === user.id) {
      return NextResponse.json({ error: "Cannot endorse yourself" }, { status: 400 });
    }

    // Check if connected
    const connected = await prisma.connection.findFirst({
      where: {
        status: "accepted",
        OR: [
          { requesterId: user.id, receiverId: endorseeId },
          { requesterId: endorseeId, receiverId: user.id },
        ],
      },
    });

    if (!connected) {
      return NextResponse.json({ error: "Must be connected to endorse" }, { status: 403 });
    }

    // Toggle: if exists, remove; if not, create
    const existing = await prisma.profileEndorsement.findUnique({
      where: {
        endorserId_endorseeId_skill: {
          endorserId: user.id,
          endorseeId,
          skill,
        },
      },
    });

    if (existing) {
      await prisma.profileEndorsement.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: "removed", skill });
    }

    const endorsement = await prisma.profileEndorsement.create({
      data: {
        endorserId: user.id,
        endorseeId,
        skill,
      },
    });

    // Award points
    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: POINTS.ENDORSE_USER } },
      }),
      prisma.user.update({
        where: { id: endorseeId },
        data: { points: { increment: POINTS.RECEIVE_ENDORSEMENT } },
      }),
    ]);

    // Notify endorsee
    const endorsee = await prisma.user.findUnique({ where: { id: endorseeId }, select: { username: true } });
    await prisma.notification.create({
      data: {
        type: "endorsement",
        title: "Nouvelle recommandation !",
        message: `${user.username} vous a recommande en ${skill}`,
        link: `/profile/${endorseeId}`,
        userId: endorseeId,
      },
    });

    // Activity
    await prisma.activity.create({
      data: {
        type: "endorsement",
        message: `endorsed ${endorsee?.username || "a user"} for ${skill}`,
        userId: user.id,
      },
    }).catch(() => {});

    await Promise.all([
      checkAndAwardBadges(user.id),
      checkAndAwardBadges(endorseeId),
    ]);

    return NextResponse.json({ action: "added", endorsement });
  } catch (error) {
    console.error("POST /api/network/endorsements error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
