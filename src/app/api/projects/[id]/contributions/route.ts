import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getContributionPoints } from "@/lib/points";
import { checkAndAwardBadges } from "@/lib/badges";

// POST /api/projects/:id/contributions - Add a contribution
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    const body = await req.json();
    const { type, description } = body;

    if (!type || !description?.trim()) {
      return NextResponse.json(
        { error: "Type et description de la contribution requis" },
        { status: 400 }
      );
    }

    // Validate contribution type
    const validTypes = ["code", "design", "research", "testing", "feedback"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Type de contribution invalide" },
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

    const pointsEarned = getContributionPoints(type);

    // Create contribution, award points, and notify in a transaction
    const contribution = await prisma.$transaction(async (tx) => {
      const newContribution = await tx.contribution.create({
        data: {
          type,
          description: description.trim(),
          pointsEarned,
          userId: user.id,
          projectId: params.id,
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

      // Award points to the contributing user
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: pointsEarned } },
      });

      // Create notification for the project creator (if contributor is not the creator)
      const creatorMember = project.members[0];
      if (creatorMember && creatorMember.userId !== user.id) {
        await tx.notification.create({
          data: {
            type: "contribution",
            title: "Nouvelle contribution",
            message: `${user.username} a ajoute une contribution (${type}) au projet "${project.title}"`,
            link: `/projects/${params.id}`,
            userId: creatorMember.userId,
          },
        });
      }

      return newContribution;
    });

    // Log activity for real-time feed
    await prisma.activity.create({
      data: {
        type: "contribution",
        message: `${user.username} contributed to "${project.title}"`,
        metadata: JSON.stringify({ projectId: params.id, type }),
        userId: user.id,
      },
    }).catch(() => {});

    // First-action celebration: check if this is user's first contribution
    const contribCount = await prisma.contribution.count({ where: { userId: user.id } });
    if (contribCount === 1) {
      await prisma.notification.create({
        data: {
          type: "first_action",
          title: "Premiere contribution !",
          message: "Vous avez fait votre premiere contribution ! Bravo !",
          link: `/projects/${params.id}`,
          userId: user.id,
        },
      }).catch(() => {});
    }

    // Check for badge awards
    await checkAndAwardBadges(user.id);

    return NextResponse.json(
      {
        ...contribution,
        createdAt: contribution.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/projects/:id/contributions error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
