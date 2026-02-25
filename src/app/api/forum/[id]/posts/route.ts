import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POINTS } from "@/lib/points";

// POST /api/forum/:id/posts - Add a reply to a forum thread
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    const body = await req.json();
    const { content, parentId } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Le contenu est requis" },
        { status: 400 }
      );
    }

    // Verify the thread exists and is not locked
    const thread = await prisma.forumThread.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, authorId: true, isLocked: true },
    });

    if (!thread) {
      return NextResponse.json(
        { error: "Sujet non trouve" },
        { status: 404 }
      );
    }

    if (thread.isLocked) {
      return NextResponse.json(
        { error: "Ce sujet est verrouille" },
        { status: 403 }
      );
    }

    // If replying to a post, verify the parent exists and belongs to this thread
    if (parentId) {
      const parentPost = await prisma.forumPost.findFirst({
        where: { id: parentId, threadId: params.id },
      });
      if (!parentPost) {
        return NextResponse.json(
          { error: "Message parent non trouve" },
          { status: 404 }
        );
      }
    }

    // Create post, update thread, award points, and notify in a transaction
    const post = await prisma.$transaction(async (tx) => {
      const newPost = await tx.forumPost.create({
        data: {
          content: content.trim(),
          authorId: user.id,
          threadId: params.id,
          parentId: parentId || null,
        },
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
      });

      // Update thread's updatedAt timestamp
      await tx.forumThread.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
      });

      // Award points for posting
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: POINTS.FORUM_POST } },
      });

      // Notify the thread author (if poster is not the author)
      if (thread.authorId !== user.id) {
        await tx.notification.create({
          data: {
            type: "forum",
            title: "Nouvelle reponse",
            message: `${user.username} a repondu dans votre sujet "${thread.title}"`,
            link: `/forum/${params.id}`,
            userId: thread.authorId,
          },
        });
      }

      return newPost;
    });

    return NextResponse.json(
      {
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/forum/:id/posts error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
