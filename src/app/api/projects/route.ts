import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POINTS } from "@/lib/points";

// GET /api/projects - List projects with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const hasLocation = searchParams.get("hasLocation");

    const where: Record<string, unknown> = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (hasLocation === "true") {
      where.latitude = { not: null };
      where.longitude = { not: null };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        members: {
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
        },
        _count: {
          select: {
            members: true,
            comments: true,
            contributions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const serialized = projects.map((project) => ({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      members: project.members.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      })),
    }));

    return NextResponse.json({ projects: serialized });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    const body = await req.json();
    const {
      title, description, category, status, country, latitude, longitude, imageUrl,
      problemAddressed, challengeId,
      // V7 Impact fields
      problemSeverity, populationAffected, geographicScope,
      implementationReadiness, scalabilityPotential, verificationMethod,
    } = body;

    if (!title?.trim() || !description?.trim() || !category) {
      return NextResponse.json(
        { error: "Titre, description et categorie requis" },
        { status: 400 }
      );
    }

    // Create project and add creator as member in a transaction
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          category,
          status: status || "open",
          country: country || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          imageUrl: imageUrl || null,
          problemAddressed: problemAddressed?.trim() || null,
          challengeId: challengeId || null,
          // V7 Impact fields
          problemSeverity: problemSeverity ? parseInt(problemSeverity) : null,
          populationAffected: populationAffected?.trim() || null,
          geographicScope: geographicScope || null,
          implementationReadiness: implementationReadiness ? parseInt(implementationReadiness) : null,
          scalabilityPotential: scalabilityPotential ? parseInt(scalabilityPotential) : null,
          verificationMethod: verificationMethod?.trim() || null,
        },
      });

      // Auto-add creator as "creator" role member
      await tx.projectMember.create({
        data: {
          userId: user.id,
          projectId: newProject.id,
          role: "creator",
        },
      });

      // Award points for creating a project
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: POINTS.CREATE_PROJECT } },
      });

      return newProject;
    });

    // Fetch the full project with relations
    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
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
        _count: {
          select: {
            members: true,
            comments: true,
            contributions: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...fullProject,
        createdAt: fullProject!.createdAt.toISOString(),
        updatedAt: fullProject!.updatedAt.toISOString(),
        members: fullProject!.members.map((m) => ({
          ...m,
          joinedAt: m.joinedAt.toISOString(),
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
