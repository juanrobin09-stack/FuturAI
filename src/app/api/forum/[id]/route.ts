import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/forum/:id - Get thread detail with posts
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const thread = await prisma.forumThread.findUnique({
      where: { id: params.id },
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
          where: { parentId: null },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                country: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                    country: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!thread) {
      return NextResponse.json(
        { error: "Sujet non trouve" },
        { status: 404 }
      );
    }

    // Increment view count (fire-and-forget)
    await prisma.forumThread
      .update({
        where: { id: params.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    // Serialize dates
    const serialized = {
      ...thread,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      posts: thread.posts.map((post) => ({
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        replies: post.replies.map((reply) => ({
          ...reply,
          createdAt: reply.createdAt.toISOString(),
          updatedAt: reply.updatedAt.toISOString(),
        })),
      })),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("GET /api/forum/:id error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
