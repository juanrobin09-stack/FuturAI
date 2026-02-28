import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POINTS } from "@/lib/points";

export const dynamic = 'force-dynamic';

// GET /api/sandbox/sessions/:id/comments
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await prisma.sandboxComment.findMany({
      where: { sessionId: params.id },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      comments: comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/sandbox/sessions/:id/comments error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/sandbox/sessions/:id/comments
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
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

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.sandboxComment.create({
        data: {
          content: content.trim(),
          userId: user.id,
          sessionId: params.id,
        },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      });

      // Award points
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: POINTS.COMMENT } },
      });

      return newComment;
    });

    // Notify session creator
    if (session.creatorId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "comment",
          title: "New sandbox comment",
          message: `${user.username} commented on "${session.name}"`,
          link: `/sandbox`,
          userId: session.creatorId,
        },
      }).catch(() => {});
    }

    return NextResponse.json(
      { ...comment, createdAt: comment.createdAt.toISOString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sandbox/sessions/:id/comments error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
