import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getAuthUserId } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { isValidId } from "@/lib/validation";

// GET /api/ideas/:id/collaborate — list collaborators
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const collaborators = await prisma.ideaCollaborator.findMany({
      where: { ideaId: params.id, status: "active" },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, country: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Also check if current user is a collaborator
    let isCollaborator = false;
    let userRole: string | null = null;
    try {
      const authId = await getAuthUserId();
      if (authId) {
        const user = await getCurrentUser();
        const myCollab = collaborators.find((c) => c.userId === user.id);
        if (myCollab) {
          isCollaborator = true;
          userRole = myCollab.role;
        }
      }
    } catch {}

    return NextResponse.json({
      collaborators,
      isCollaborator,
      userRole,
      count: collaborators.length,
    });
  } catch (error) {
    console.error("GET /api/ideas/:id/collaborate error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/ideas/:id/collaborate — join an idea
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
        { error: "Connectez-vous pour rejoindre cette idee" },
        { status: 401 }
      );
    }

    const user = await getCurrentUser();
    const body = await req.json();
    const { role, message } = body;

    // Verify idea exists
    const idea = await prisma.idea.findUnique({ where: { id: params.id } });
    if (!idea) {
      return NextResponse.json({ error: "Idee non trouvee" }, { status: 404 });
    }

    const validRoles = ["contributor", "researcher", "developer", "designer", "mentor"];
    const collabRole = validRoles.includes(role) ? role : "contributor";

    // Upsert — rejoin if previously left
    const collaborator = await prisma.ideaCollaborator.upsert({
      where: { userId_ideaId: { userId: user.id, ideaId: params.id } },
      update: {
        role: collabRole,
        message: message?.trim() || null,
        status: "active",
      },
      create: {
        userId: user.id,
        ideaId: params.id,
        role: collabRole,
        message: message?.trim() || null,
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Award points for joining
    await prisma.user.update({
      where: { id: user.id },
      data: { points: { increment: 5 } },
    }).catch(() => {});

    // Update idea status to "in_progress" if it has collaborators
    const collabCount = await prisma.ideaCollaborator.count({
      where: { ideaId: params.id, status: "active" },
    });
    if (collabCount >= 1 && idea.status === "proposed") {
      await prisma.idea.update({
        where: { id: params.id },
        data: { status: "in_progress" },
      }).catch(() => {});
    }

    // Notify idea author
    if (idea.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "project_invite",
          title: "Nouveau collaborateur !",
          message: `${user.username} veut contribuer a "${idea.title.substring(0, 50)}" en tant que ${collabRole}`,
          link: `/ideas/${idea.id}`,
          userId: idea.authorId,
        },
      }).catch(() => {});
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: "project_join",
        message: `${user.username} a rejoint une idee`,
        metadata: JSON.stringify({ ideaId: params.id, role: collabRole }),
        userId: user.id,
      },
    }).catch(() => {});

    return NextResponse.json(collaborator, { status: 201 });
  } catch (error) {
    console.error("POST /api/ideas/:id/collaborate error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/ideas/:id/collaborate — leave an idea
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const authId = await getAuthUserId();
    if (!authId) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const user = await getCurrentUser();

    await prisma.ideaCollaborator.updateMany({
      where: { userId: user.id, ideaId: params.id },
      data: { status: "left" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/ideas/:id/collaborate error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
