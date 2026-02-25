import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POINTS } from "@/lib/points";

// GET /api/forum - List forum threads with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "recent";

    const where: Record<string, unknown> = {};

    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy =
      sort === "popular"
        ? { viewCount: "desc" as const }
        : { updatedAt: "desc" as const };

    const threads = await prisma.forumThread.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            country: true,
          },
        },
        posts: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            author: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { posts: true },
        },
      },
      orderBy: [{ isPinned: "desc" }, orderBy],
      take: 50,
    });

    const serialized = threads.map((thread) => ({
      ...thread,
      posts: thread.posts.map((post) => ({
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      })),
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    }));

    return NextResponse.json({ threads: serialized });
  } catch (error) {
    console.error("GET /api/forum error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/forum - Create a new forum thread
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    const body = await req.json();
    const { title, content, category } = body;

    if (!title?.trim() || !content?.trim() || !category) {
      return NextResponse.json(
        { error: "Titre, contenu et categorie requis" },
        { status: 400 }
      );
    }

    const thread = await prisma.$transaction(async (tx) => {
      const newThread = await tx.forumThread.create({
        data: {
          title: title.trim(),
          content: content.trim(),
          category,
          authorId: user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Award points for creating a forum thread
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: POINTS.CREATE_FORUM_THREAD } },
      });

      // Log activity
      await tx.activity.create({
        data: {
          type: "forum",
          message: `${user.username} a cree un sujet: "${title.trim()}"`,
          metadata: JSON.stringify({ threadId: newThread.id }),
          userId: user.id,
        },
      });

      return newThread;
    });

    return NextResponse.json(
      {
        ...thread,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/forum error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
