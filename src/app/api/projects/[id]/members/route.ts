import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POINTS } from "@/lib/points";
import { checkAndAwardBadges } from "@/lib/badges";

// POST /api/projects/:id/members - Join a project
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    const body = await req.json();
    const { role } = body;

    // Validate role
    if (!role || !["contributor", "tester"].includes(role)) {
      return NextResponse.json(
        { error: "Role invalide. Choisir 'contributor' ou 'tester'" },
        { status: 400 }
      );
    }

    // Verify the project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouve" },
        { status: 404 }
      );
    }

    // Check for duplicate membership
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: params.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "Vous etes deja membre de ce projet" },
        { status: 409 }
      );
    }

    // Create membership and award points in a transaction
    const member = await prisma.$transaction(async (tx) => {
      const newMember = await tx.projectMember.create({
        data: {
          userId: user.id,
          projectId: params.id,
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              country: true,
            },
          },
        },
      });

      // Award points for joining a project
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: POINTS.JOIN_PROJECT } },
      });

      return newMember;
    });

    // Log activity for real-time feed
    await prisma.activity.create({
      data: {
        type: "project_join",
        message: `${user.username} joined project "${project.title}"`,
        metadata: JSON.stringify({ projectId: params.id }),
        userId: user.id,
      },
    }).catch(() => {});

    // First-action celebration: check if this is user's first project
    const memberCount = await prisma.projectMember.count({ where: { userId: user.id } });
    if (memberCount === 1) {
      await prisma.notification.create({
        data: {
          type: "first_action",
          title: "Premier projet !",
          message: "Vous avez rejoint votre premier projet collaboratif !",
          link: `/projects/${params.id}`,
          userId: user.id,
        },
      }).catch(() => {});
    }

    // Check for badge awards
    await checkAndAwardBadges(user.id);

    return NextResponse.json(
      {
        ...member,
        joinedAt: member.joinedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/projects/:id/members error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
