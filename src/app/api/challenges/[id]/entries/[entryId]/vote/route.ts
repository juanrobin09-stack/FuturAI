import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { POINTS } from "@/lib/points";

// POST /api/challenges/:id/entries/:entryId/vote - Vote for a challenge entry
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const user = await getCurrentUser();

    // Verify challenge exists and is in voting phase
    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    if (challenge.status !== "voting") {
      return NextResponse.json(
        { error: "Challenge is not in voting phase" },
        { status: 400 }
      );
    }

    // Verify entry exists
    const entry = await prisma.challengeEntry.findUnique({
      where: { id: params.entryId },
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Prevent self-voting
    if (entry.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot vote for your own entry" },
        { status: 400 }
      );
    }

    // Increment score and award voter points in a transaction
    await prisma.$transaction(async (tx) => {
      // Increment the entry score
      await tx.challengeEntry.update({
        where: { id: params.entryId },
        data: { score: { increment: 1 } },
      });

      // Award vote points to the voter
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: POINTS.VOTE } },
      });

      // Notify the entry author
      if (entry.userId !== user.id) {
        await tx.notification.create({
          data: {
            type: "vote",
            title: "New vote on your entry",
            message: `${user.username} voted for your entry in "${challenge.title}"`,
            link: `/challenges/${params.id}`,
            userId: entry.userId,
          },
        });
      }
    });

    // Log activity for real-time feed
    await prisma.activity.create({
      data: {
        type: "vote",
        message: `${user.username} voted in challenge "${challenge.title}"`,
        metadata: JSON.stringify({ challengeId: params.id, entryId: params.entryId }),
        userId: user.id,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/challenges/:id/entries/:entryId/vote error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
