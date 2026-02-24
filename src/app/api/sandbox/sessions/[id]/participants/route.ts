import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/sandbox/sessions/:id/participants - Add participant
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { userId: targetUserId, role } = body;

    // Verify session exists and user is creator
    const session = await prisma.sandboxSession.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.creatorId !== user.id) {
      return NextResponse.json(
        { error: "Only the creator can add participants" },
        { status: 403 }
      );
    }

    // Check if already a participant
    const existing = await prisma.sandboxParticipant.findUnique({
      where: {
        userId_sessionId: { userId: targetUserId, sessionId: params.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User is already a participant" },
        { status: 409 }
      );
    }

    const participant = await prisma.sandboxParticipant.create({
      data: {
        userId: targetUserId,
        sessionId: params.id,
        role: role || "editor",
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Notify the added user
    await prisma.notification.create({
      data: {
        type: "project_invite",
        title: "Sandbox invitation",
        message: `${user.username} invited you to sandbox session "${session.name}"`,
        link: `/sandbox`,
        userId: targetUserId,
      },
    }).catch(() => {});

    return NextResponse.json(
      { ...participant, joinedAt: participant.joinedAt.toISOString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sandbox/sessions/:id/participants error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
