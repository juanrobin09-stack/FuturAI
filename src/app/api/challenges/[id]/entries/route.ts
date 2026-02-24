import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POINTS } from "@/lib/points";
import { checkAndAwardBadges } from "@/lib/badges";

// POST /api/challenges/:id/entries - Submit a challenge entry
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    const body = await req.json();
    const { description, projectId, demoUrl } = body;

    if (!description?.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Verify the challenge exists and is open
    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    if (challenge.status !== "open") {
      return NextResponse.json(
        { error: "Challenge is not accepting entries" },
        { status: 400 }
      );
    }

    // Check if user already submitted an entry (unique constraint: userId + challengeId)
    const existingEntry = await prisma.challengeEntry.findUnique({
      where: {
        userId_challengeId: {
          userId: user.id,
          challengeId: params.id,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "You have already submitted an entry for this challenge" },
        { status: 409 }
      );
    }

    // If projectId is provided, verify it exists
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
    }

    // Create entry, award points in a transaction
    const entry = await prisma.$transaction(async (tx) => {
      const newEntry = await tx.challengeEntry.create({
        data: {
          description: description.trim(),
          demoUrl: demoUrl?.trim() || null,
          userId: user.id,
          challengeId: params.id,
          projectId: projectId || null,
        },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
          project: {
            select: { id: true, title: true },
          },
        },
      });

      // Award points for submitting a challenge entry
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: POINTS.SUBMIT_CHALLENGE } },
      });

      // Create notification for the user (confirmation)
      await tx.notification.create({
        data: {
          type: "challenge",
          title: "Challenge entry submitted",
          message: `Your entry for "${challenge.title}" has been submitted! +${POINTS.SUBMIT_CHALLENGE} pts`,
          link: `/challenges/${params.id}`,
          userId: user.id,
        },
      });

      return newEntry;
    });

    // Log activity for real-time feed
    await prisma.activity.create({
      data: {
        type: "challenge_entry",
        message: `${user.username} entered challenge: "${challenge.title}"`,
        metadata: JSON.stringify({ challengeId: params.id }),
        userId: user.id,
      },
    }).catch(() => {});

    // Check for badge awards
    await checkAndAwardBadges(user.id);

    return NextResponse.json(
      {
        ...entry,
        createdAt: entry.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/challenges/:id/entries error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
