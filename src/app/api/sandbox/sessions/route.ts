import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POINTS } from "@/lib/points";

export const dynamic = 'force-dynamic';

// GET /api/sandbox/sessions - List user's sandbox sessions
export async function GET() {
  try {
    const user = await getCurrentUser();

    const sessions = await prisma.sandboxSession.findMany({
      where: {
        OR: [
          { creatorId: user.id },
          { participants: { some: { userId: user.id } } },
        ],
      },
      include: {
        creator: { select: { id: true, username: true, avatarUrl: true } },
        participants: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
        _count: { select: { versions: true, comments: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        versions: s.versions.map((v) => ({
          ...v,
          createdAt: v.createdAt.toISOString(),
        })),
        participants: s.participants.map((p) => ({
          ...p,
          joinedAt: p.joinedAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    console.error("GET /api/sandbox/sessions error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/sandbox/sessions - Create a new sandbox session
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { name, type, description, projectId, problemStatement, proposedImpact } = body;

    if (!name?.trim() || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    const validTypes = ["text-to-image", "text-to-code", "text-to-video"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid sandbox type" },
        { status: 400 }
      );
    }

    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.sandboxSession.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          problemStatement: problemStatement?.trim() || null,
          proposedImpact: proposedImpact?.trim() || null,
          type,
          creatorId: user.id,
          projectId: projectId || null,
        },
        include: {
          creator: { select: { id: true, username: true, avatarUrl: true } },
        },
      });

      // Add creator as participant
      await tx.sandboxParticipant.create({
        data: {
          userId: user.id,
          sessionId: newSession.id,
          role: "editor",
        },
      });

      // Award points
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: POINTS.SANDBOX_GENERATE } },
      });

      return newSession;
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "sandbox",
        message: `${user.username} created arena session "${name.trim()}"`,
        metadata: JSON.stringify({ sessionId: session.id }),
        userId: user.id,
      },
    }).catch(() => {});

    return NextResponse.json(
      { ...session, createdAt: session.createdAt.toISOString(), updatedAt: session.updatedAt.toISOString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sandbox/sessions error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
