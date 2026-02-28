import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POINTS } from "@/lib/points";
import { checkAndAwardBadges } from "@/lib/badges";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();

    const [connections, pendingReceived, pendingSent] = await Promise.all([
      // Accepted connections
      prisma.connection.findMany({
        where: {
          status: "accepted",
          OR: [{ requesterId: user.id }, { receiverId: user.id }],
        },
        include: {
          requester: { select: { id: true, username: true, avatarUrl: true, country: true, points: true, bio: true } },
          receiver: { select: { id: true, username: true, avatarUrl: true, country: true, points: true, bio: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      // Pending requests received
      prisma.connection.findMany({
        where: { receiverId: user.id, status: "pending" },
        include: {
          requester: { select: { id: true, username: true, avatarUrl: true, country: true, points: true, bio: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Pending requests sent
      prisma.connection.findMany({
        where: { requesterId: user.id, status: "pending" },
        include: {
          receiver: { select: { id: true, username: true, avatarUrl: true, country: true, points: true, bio: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Build connections list with the "other" user
    const connectionsList = connections.map((c) => {
      const other = c.requesterId === user.id ? c.receiver : c.requester;
      return { connectionId: c.id, user: other, connectedAt: c.updatedAt };
    });

    return NextResponse.json({
      connections: connectionsList,
      pendingReceived,
      pendingSent,
    });
  } catch (error) {
    console.error("GET /api/network/connections error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const { targetUserId } = await req.json();

    if (!targetUserId || targetUserId === user.id) {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    // Check target exists
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if connection already exists (in either direction)
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: user.id, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: user.id },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Connection already exists", status: existing.status }, { status: 409 });
    }

    // Create connection request
    const connection = await prisma.connection.create({
      data: {
        requesterId: user.id,
        receiverId: targetUserId,
        status: "pending",
      },
    });

    // Award points
    await prisma.user.update({
      where: { id: user.id },
      data: { points: { increment: POINTS.SEND_CONNECTION } },
    });

    // Notify receiver
    await prisma.notification.create({
      data: {
        type: "connection_request",
        title: "Demande de connexion",
        message: `${user.username} souhaite se connecter avec vous`,
        link: "/reseau",
        userId: targetUserId,
      },
    });

    // Activity
    await prisma.activity.create({
      data: {
        type: "connection",
        message: `sent a connection request to ${target.username}`,
        userId: user.id,
      },
    }).catch(() => {});

    await checkAndAwardBadges(user.id);

    return NextResponse.json(connection);
  } catch (error) {
    console.error("POST /api/network/connections error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
