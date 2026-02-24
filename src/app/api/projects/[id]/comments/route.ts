import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POINTS } from "@/lib/points";

// POST /api/projects/:id/comments - Add a comment (or reply)
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
        { error: "Le contenu du commentaire est requis" },
        { status: 400 }
      );
    }

    // Verify the project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        members: {
          where: { role: "creator" },
          select: { userId: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouve" },
        { status: 404 }
      );
    }

    // If replying, verify parent comment exists and belongs to this project
    if (parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: { id: parentId, projectId: params.id },
      });
      if (!parentComment) {
        return NextResponse.json(
          { error: "Commentaire parent non trouve" },
          { status: 404 }
        );
      }
    }

    // Create comment and award points in a transaction
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content: content.trim(),
          userId: user.id,
          projectId: params.id,
          parentId: parentId || null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Award points for commenting
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: POINTS.COMMENT } },
      });

      // Create notification for the project creator (if commenter is not the creator)
      const creatorMember = project.members[0];
      if (creatorMember && creatorMember.userId !== user.id) {
        await tx.notification.create({
          data: {
            type: "comment",
            title: "Nouveau commentaire",
            message: `${user.username} a commente sur le projet "${project.title}"`,
            link: `/projects/${params.id}`,
            userId: creatorMember.userId,
          },
        });
      }

      return newComment;
    });

    return NextResponse.json(
      {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/projects/:id/comments error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
