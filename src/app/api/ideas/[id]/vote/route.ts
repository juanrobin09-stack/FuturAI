import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkAndAwardBadges } from "@/lib/badges";

// POST /api/ideas/:id/vote
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    const body = await req.json();
    const value = body.value; // 1, -1, or 0 (remove vote)

    if (![1, -1, 0].includes(value)) {
      return NextResponse.json({ error: "Valeur de vote invalide" }, { status: 400 });
    }

    // Check if idea exists
    const idea = await prisma.idea.findUnique({ where: { id: params.id } });
    if (!idea) {
      return NextResponse.json({ error: "Idee non trouvee" }, { status: 404 });
    }

    if (value === 0) {
      // Remove vote
      await prisma.vote.deleteMany({
        where: { userId: user.id, ideaId: params.id },
      });
    } else {
      // Upsert vote
      await prisma.vote.upsert({
        where: {
          userId_ideaId: { userId: user.id, ideaId: params.id },
        },
        update: { value },
        create: {
          userId: user.id,
          ideaId: params.id,
          value,
        },
      });
    }

    // Return new score
    const votes = await prisma.vote.findMany({
      where: { ideaId: params.id },
      select: { value: true },
    });
    const score = votes.reduce((sum, v) => sum + v.value, 0);

    // Award points
    if (value !== 0) {
      // VOTE point to voter
      await prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: 1 } },
      }).catch(() => {});

      // RECEIVE_VOTE points to the idea author
      if (idea.authorId !== user.id) {
        await prisma.user.update({
          where: { id: idea.authorId },
          data: { points: { increment: 2 } },
        }).catch(() => {});
      }
    }

    // Log activity for real-time feed
    if (value !== 0) {
      await prisma.activity.create({
        data: {
          type: "vote",
          message: `${user.username} voted on an idea`,
          metadata: JSON.stringify({ ideaId: params.id, value }),
          userId: user.id,
        },
      }).catch(() => {});
    }

    // Check for badge awards
    await checkAndAwardBadges(user.id);

    return NextResponse.json({ score, voteCount: votes.length });
  } catch (error) {
    console.error("POST /api/ideas/:id/vote error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
