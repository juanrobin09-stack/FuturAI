import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getAuthUserId } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { isValidId } from "@/lib/validation";

// GET /api/ideas/:id/comments — list all comments for an idea
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const comments = await prisma.ideaComment.findMany({
      where: { ideaId: params.id, parentId: null },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        replies: {
          include: {
            author: { select: { id: true, username: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET /api/ideas/:id/comments error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/ideas/:id/comments — add a comment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blocked = applyRateLimit(req, "write");
    if (blocked) return blocked;

    if (!isValidId(params.id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const authId = await getAuthUserId();
    if (!authId) {
      return NextResponse.json(
        { error: "Connectez-vous pour commenter" },
        { status: 401 }
      );
    }

    const user = await getCurrentUser();
    const body = await req.json();
    const { content, type, parentId } = body;

    if (!content?.trim() || content.trim().length < 2) {
      return NextResponse.json(
        { error: "Le commentaire est trop court" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Le commentaire est trop long (max 2000 caractères)" },
        { status: 400 }
      );
    }

    // Verify idea exists
    const idea = await prisma.idea.findUnique({ where: { id: params.id } });
    if (!idea) {
      return NextResponse.json({ error: "Idée non trouvée" }, { status: 404 });
    }

    // If replying, verify parent comment exists
    if (parentId) {
      const parent = await prisma.ideaComment.findUnique({ where: { id: parentId } });
      if (!parent || parent.ideaId !== params.id) {
        return NextResponse.json({ error: "Commentaire parent invalide" }, { status: 400 });
      }
    }

    const validTypes = ["comment", "resource", "question", "suggestion"];
    const commentType = validTypes.includes(type) ? type : "comment";

    const comment = await prisma.ideaComment.create({
      data: {
        content: content.trim(),
        type: commentType,
        authorId: user.id,
        ideaId: params.id,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Award points
    await prisma.user.update({
      where: { id: user.id },
      data: { points: { increment: 2 } },
    }).catch(() => {});

    // Notify idea author (if different from commenter)
    if (idea.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "comment",
          title: "Nouveau commentaire",
          message: `${user.username} a commenté votre idée "${idea.title.substring(0, 50)}"`,
          link: `/ideas/${idea.id}`,
          userId: idea.authorId,
        },
      }).catch(() => {});
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: "comment",
        message: `${user.username} a commenté une idée`,
        metadata: JSON.stringify({ ideaId: params.id, commentId: comment.id }),
        userId: user.id,
      },
    }).catch(() => {});

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/ideas/:id/comments error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
