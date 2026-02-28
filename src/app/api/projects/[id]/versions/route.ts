import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// POST /api/projects/:id/versions - Create a new project version
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    const body = await req.json();
    const { version, changelog } = body;

    if (!version?.trim() || !changelog?.trim()) {
      return NextResponse.json(
        { error: "Version number and changelog are required" },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify user is a project member
    if (project.members.length === 0) {
      return NextResponse.json(
        { error: "You must be a project member to add versions" },
        { status: 403 }
      );
    }

    const newVersion = await prisma.projectVersion.create({
      data: {
        version: version.trim(),
        changelog: changelog.trim(),
        projectId: params.id,
      },
    });

    return NextResponse.json(
      {
        ...newVersion,
        createdAt: newVersion.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/projects/:id/versions error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
