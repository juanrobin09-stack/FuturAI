import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/sandbox/share/:slug - Public sandbox preview
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await prisma.sandboxSession.findUnique({
      where: { shareSlug: params.slug },
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
        project: { select: { id: true, title: true } },
      },
    });

    if (!session || !session.isPublic) {
      return NextResponse.json(
        { error: "Session not found or not public" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...session,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      versions: session.versions.map((v) => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
      })),
      participants: session.participants.map((p) => ({
        ...p,
        joinedAt: p.joinedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/sandbox/share/:slug error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
