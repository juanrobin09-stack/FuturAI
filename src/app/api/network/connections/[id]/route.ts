import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POINTS } from "@/lib/points";
import { checkAndAwardBadges } from "@/lib/badges";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const { action } = await req.json();

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const connection = await prisma.connection.findUnique({
      where: { id },
      include: { requester: { select: { id: true, username: true } } },
    });

    if (!connection || connection.receiverId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (connection.status !== "pending") {
      return NextResponse.json({ error: "Already processed" }, { status: 400 });
    }

    const updated = await prisma.connection.update({
      where: { id },
      data: { status: action === "accept" ? "accepted" : "declined" },
    });

    if (action === "accept") {
      // Award points to both users
      await Promise.all([
        prisma.user.update({
          where: { id: user.id },
          data: { points: { increment: POINTS.ACCEPT_CONNECTION } },
        }),
        prisma.user.update({
          where: { id: connection.requesterId },
          data: { points: { increment: POINTS.ACCEPT_CONNECTION } },
        }),
      ]);

      // Notify requester
      await prisma.notification.create({
        data: {
          type: "connection_accepted",
          title: "Connexion acceptee !",
          message: `${user.username} a accepte votre demande de connexion`,
          link: `/profile/${user.id}`,
          userId: connection.requesterId,
        },
      });

      // Activity
      await prisma.activity.create({
        data: {
          type: "connection",
          message: `connected with ${connection.requester.username}`,
          userId: user.id,
        },
      }).catch(() => {});

      await Promise.all([
        checkAndAwardBadges(user.id),
        checkAndAwardBadges(connection.requesterId),
      ]);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/network/connections/[id] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const connection = await prisma.connection.findUnique({ where: { id } });
    if (!connection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only participants can delete
    if (connection.requesterId !== user.id && connection.receiverId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.connection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/network/connections/[id] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
