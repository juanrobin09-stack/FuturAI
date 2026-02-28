import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POINTS } from "@/lib/points";

export const dynamic = 'force-dynamic';

// POST /api/sandbox/sessions/:id/versions - Add new version
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { prompt, resultText, resultUrl, changelog } = body;

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = await prisma.sandboxSession.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify user is participant
    const participant = await prisma.sandboxParticipant.findUnique({
      where: {
        userId_sessionId: { userId: user.id, sessionId: params.id },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant of this session" },
        { status: 403 }
      );
    }

    // Get next version number
    const lastVersion = await prisma.sandboxVersion.findFirst({
      where: { sessionId: params.id },
      orderBy: { version: "desc" },
    });
    const nextVersion = (lastVersion?.version || 0) + 1;

    const version = await prisma.$transaction(async (tx) => {
      const newVersion = await tx.sandboxVersion.create({
        data: {
          version: nextVersion,
          prompt: prompt.trim(),
          resultText: resultText || null,
          resultUrl: resultUrl || null,
          changelog: changelog?.trim() || null,
          authorId: user.id,
          sessionId: params.id,
        },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
        },
      });

      // Update session timestamp
      await tx.sandboxSession.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
      });

      // Award points
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: POINTS.SANDBOX_GENERATE } },
      });

      return newVersion;
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "version",
        message: `${user.username} added v${nextVersion} to sandbox "${session.name}"`,
        metadata: JSON.stringify({ sessionId: params.id, version: nextVersion }),
        userId: user.id,
      },
    }).catch(() => {});

    // Notify other participants
    const otherParticipants = await prisma.sandboxParticipant.findMany({
      where: { sessionId: params.id, userId: { not: user.id } },
    });
    for (const p of otherParticipants) {
      await prisma.notification.create({
        data: {
          type: "contribution",
          title: "New arena version",
          message: `${user.username} added v${nextVersion} to "${session.name}"`,
          link: `/arena`,
          userId: p.userId,
        },
      }).catch(() => {});
    }

    return NextResponse.json(
      { ...version, createdAt: version.createdAt.toISOString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sandbox/sessions/:id/versions error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
