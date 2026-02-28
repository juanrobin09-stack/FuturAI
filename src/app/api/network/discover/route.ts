import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // Get IDs of users already connected or pending
    const existingConnections = await prisma.connection.findMany({
      where: {
        OR: [{ requesterId: user.id }, { receiverId: user.id }],
        status: { in: ["pending", "accepted"] },
      },
      select: { requesterId: true, receiverId: true },
    });

    const excludeIds = new Set<string>([user.id]);
    for (const c of existingConnections) {
      excludeIds.add(c.requesterId);
      excludeIds.add(c.receiverId);
    }

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        ...(search
          ? {
              OR: [
                { username: { contains: search, mode: "insensitive" } },
                { country: { contains: search, mode: "insensitive" } },
                { bio: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        country: true,
        points: true,
        bio: true,
        _count: {
          select: {
            connectionsSent: { where: { status: "accepted" } },
            connectionsReceived: { where: { status: "accepted" } },
            endorsementsReceived: true,
          },
        },
      },
      orderBy: { points: "desc" },
      take: 50,
    });

    // Calculate mutual connections for each user
    const usersWithMutual = await Promise.all(
      users.map(async (u) => {
        const mutual = await prisma.connection.count({
          where: {
            status: "accepted",
            OR: [
              {
                requesterId: u.id,
                receiver: {
                  OR: [
                    { connectionsSent: { some: { receiverId: user.id, status: "accepted" } } },
                    { connectionsReceived: { some: { requesterId: user.id, status: "accepted" } } },
                  ],
                },
              },
              {
                receiverId: u.id,
                requester: {
                  OR: [
                    { connectionsSent: { some: { receiverId: user.id, status: "accepted" } } },
                    { connectionsReceived: { some: { requesterId: user.id, status: "accepted" } } },
                  ],
                },
              },
            ],
          },
        });
        return {
          ...u,
          connectionsCount: u._count.connectionsSent + u._count.connectionsReceived,
          endorsementsCount: u._count.endorsementsReceived,
          mutualConnections: mutual,
        };
      })
    );

    // Sort: mutual connections first, then points
    usersWithMutual.sort((a, b) => b.mutualConnections - a.mutualConnections || b.points - a.points);

    return NextResponse.json({ users: usersWithMutual });
  } catch (error) {
    console.error("GET /api/network/discover error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
