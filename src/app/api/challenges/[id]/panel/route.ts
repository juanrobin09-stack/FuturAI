import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/challenges/:id/panel - List panel members
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const panels = await prisma.challengePanel.findMany({
      where: { challengeId: params.id },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, role: true } },
        _count: { select: { evaluations: true } },
      },
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json({
      panels: panels.map((p) => ({
        ...p,
        assignedAt: p.assignedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/challenges/:id/panel error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/challenges/:id/panel - Invite expert to panel
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
    }

    if (!["EXPERT_VOLUNTEER", "EXPERT_INSTITUTION"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Verify challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
    });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Only ADMIN can invite experts to panel
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: only admins can invite panel members" }, { status: 403 });
    }

    const panel = await prisma.challengePanel.create({
      data: {
        role,
        challengeId: params.id,
        userId,
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Send notification
    await prisma.notification.create({
      data: {
        type: "challenge",
        title: "Expert panel invitation",
        message: `${user.username} invited you to the expert panel for "${challenge.title}"`,
        link: `/challenges/${params.id}`,
        userId,
      },
    }).catch(() => {});

    return NextResponse.json(
      { ...panel, assignedAt: panel.assignedAt.toISOString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/challenges/:id/panel error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
