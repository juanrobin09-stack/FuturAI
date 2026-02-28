import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let currentUserId: string | null = null;
    try {
      const me = await getCurrentUser();
      currentUserId = me.id;
    } catch {}

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        country: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        points: true,
        role: true,
        verified: true,
        createdAt: true,
        _count: {
          select: {
            ideas: true,
            contributions: true,
            badges: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Connection counts
    const [sentAccepted, receivedAccepted] = await Promise.all([
      prisma.connection.count({ where: { requesterId: id, status: "accepted" } }),
      prisma.connection.count({ where: { receiverId: id, status: "accepted" } }),
    ]);
    const connectionsCount = sentAccepted + receivedAccepted;

    // Projects
    const projects = await prisma.projectMember.findMany({
      where: { userId: id },
      include: {
        project: {
          select: { id: true, title: true, category: true, status: true },
        },
      },
      take: 10,
    });

    // Badges
    const badges = await prisma.userBadge.findMany({
      where: { userId: id },
      include: { badge: true },
      orderBy: { awardedAt: "desc" },
    });

    // Endorsements grouped by skill
    const endorsements = await prisma.profileEndorsement.findMany({
      where: { endorseeId: id },
      include: {
        endorser: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    const endorsementsBySkill: Record<string, { count: number; endorsers: { id: string; username: string; avatarUrl: string | null }[] }> = {};
    for (const e of endorsements) {
      if (!endorsementsBySkill[e.skill]) endorsementsBySkill[e.skill] = { count: 0, endorsers: [] };
      endorsementsBySkill[e.skill].count++;
      endorsementsBySkill[e.skill].endorsers.push(e.endorser);
    }

    // Connection status with current user
    let connectionStatus: "none" | "pending_sent" | "pending_received" | "connected" | "self" = "none";
    let connectionId: string | null = null;

    if (currentUserId) {
      if (currentUserId === id) {
        connectionStatus = "self";
      } else {
        const conn = await prisma.connection.findFirst({
          where: {
            OR: [
              { requesterId: currentUserId, receiverId: id },
              { requesterId: id, receiverId: currentUserId },
            ],
          },
        });

        if (conn) {
          connectionId = conn.id;
          if (conn.status === "accepted") {
            connectionStatus = "connected";
          } else if (conn.status === "pending") {
            connectionStatus = conn.requesterId === currentUserId ? "pending_sent" : "pending_received";
          }
        }
      }
    }

    // Mutual connections count
    let mutualConnections = 0;
    if (currentUserId && currentUserId !== id) {
      // Get this user's connections
      const theirConns = await prisma.connection.findMany({
        where: {
          status: "accepted",
          OR: [{ requesterId: id }, { receiverId: id }],
        },
        select: { requesterId: true, receiverId: true },
      });
      const theirConnIds = new Set(theirConns.map((c) => c.requesterId === id ? c.receiverId : c.requesterId));

      // Get my connections
      const myConns = await prisma.connection.findMany({
        where: {
          status: "accepted",
          OR: [{ requesterId: currentUserId }, { receiverId: currentUserId }],
        },
        select: { requesterId: true, receiverId: true },
      });
      const myConnIds = new Set(myConns.map((c) => c.requesterId === currentUserId ? c.receiverId : c.requesterId));

      Array.from(theirConnIds).forEach((connId) => {
        if (myConnIds.has(connId)) mutualConnections++;
      });
    }

    // My endorsements for this user (to show which skills I've endorsed)
    let myEndorsements: string[] = [];
    if (currentUserId && currentUserId !== id) {
      const mine = await prisma.profileEndorsement.findMany({
        where: { endorserId: currentUserId, endorseeId: id },
        select: { skill: true },
      });
      myEndorsements = mine.map((e) => e.skill);
    }

    return NextResponse.json({
      user: {
        ...user,
        connectionsCount,
        projects: projects.map((p) => p.project),
        badges: badges.map((b) => b.badge),
        endorsements: endorsementsBySkill,
        totalEndorsements: endorsements.length,
      },
      connectionStatus,
      connectionId,
      mutualConnections,
      myEndorsements,
    });
  } catch (error) {
    console.error("GET /api/profile/[id] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
