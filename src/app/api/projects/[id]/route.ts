import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET /api/projects/:id - Fetch single project with all relations
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                country: true,
                points: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        comments: {
          where: { parentId: null }, // Top-level comments only
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        contributions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        sandbox: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        versions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouve" },
        { status: 404 }
      );
    }

    // Serialize all dates
    const serialized = {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      members: project.members.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      })),
      comments: project.comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        replies: c.replies.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
      })),
      contributions: project.contributions.map((ct) => ({
        ...ct,
        createdAt: ct.createdAt.toISOString(),
      })),
      sandbox: project.sandbox.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
      versions: project.versions.map((v) => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("GET /api/projects/:id error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH /api/projects/:id - Update project fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    // Verify the project exists
    const existing = await prisma.project.findUnique({
      where: { id: params.id },
      include: { members: { where: { userId: user.id } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Projet non trouve" },
        { status: 404 }
      );
    }
    // Only project members or admins can update
    if (existing.members.length === 0 && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate text lengths
    if (body.title !== undefined && body.title.length > 200) {
      return NextResponse.json({ error: "Title too long (max 200)" }, { status: 400 });
    }
    if (body.description !== undefined && body.description.length > 10000) {
      return NextResponse.json({ error: "Description too long (max 10000)" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.status !== undefined) updateData.status = body.status;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;
    if (body.repoUrl !== undefined) updateData.repoUrl = body.repoUrl || null;
    if (body.country !== undefined) updateData.country = body.country || null;

    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      members: project.members.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("PATCH /api/projects/:id error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/projects/:id - Delete project
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    // Verify the project exists
    const existing = await prisma.project.findUnique({
      where: { id: params.id },
      include: { members: { where: { userId: user.id, role: "creator" } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Projet non trouve" },
        { status: 404 }
      );
    }
    // Only project owner or admin can delete
    if (existing.members.length === 0 && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Clean up related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete sandbox sessions linked to this project
      // (their participants, versions, comments cascade via onDelete: Cascade)
      const linkedSessions = await tx.sandboxSession.findMany({
        where: { projectId: params.id },
        select: { id: true },
      });
      if (linkedSessions.length > 0) {
        await tx.sandboxSession.deleteMany({
          where: { projectId: params.id },
        });
      }

      // Delete the project (cascade handles: members, contributions, comments, versions, etc.)
      await tx.project.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/:id error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
