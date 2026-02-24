import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/sandbox/sessions/:id - Get session with all data
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.sandboxSession.findUnique({
      where: { id: params.id },
      include: {
        creator: { select: { id: true, username: true, avatarUrl: true } },
        participants: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
        versions: {
          include: {
            author: { select: { id: true, username: true, avatarUrl: true } },
          },
          orderBy: { version: "desc" },
        },
        comments: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        project: { select: { id: true, title: true } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...session,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      versions: session.versions.map((v) => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
      })),
      comments: session.comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
      participants: session.participants.map((p) => ({
        ...p,
        joinedAt: p.joinedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/sandbox/sessions/:id error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH /api/sandbox/sessions/:id - Update session
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { name, description, isPublic, shareSlug, documentation } = body;

    const session = await prisma.sandboxSession.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.creatorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Award SHARE_SANDBOX points when making public for the first time
    const wasPrivate = !session.isPublic;
    const goingPublic = isPublic === true;

    const updated = await prisma.sandboxSession.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isPublic !== undefined && { isPublic }),
        ...(shareSlug !== undefined && { shareSlug: shareSlug?.trim() || null }),
        ...(documentation !== undefined && { documentation: documentation?.trim() || null }),
      },
    });

    if (wasPrivate && goingPublic) {
      await prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: 3 } }, // POINTS.SHARE_SANDBOX
      }).catch(() => {});
    }

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("PATCH /api/sandbox/sessions/:id error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
