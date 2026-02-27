import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getAuthUserId } from "@/lib/auth";
import { checkAndAwardBadges } from "@/lib/badges";
import { applyRateLimit } from "@/lib/rate-limit";
import { isValidId } from "@/lib/validation";

// POST /api/ideas/:id/vote
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limit
    const blocked = applyRateLimit(req, "write");
    if (blocked) return blocked;

    // Validate ID format
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Require authentication
    const authId = await getAuthUserId();
    if (!authId) {
      return NextResponse.json(
        { error: "Connectez-vous pour voter" },
        { status: 401 }
      );
    }

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

    // Prevent self-voting
    if (idea.authorId === user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas voter pour votre propre idee" },
        { status: 400 }
      );
    }

    // Check if user already has a vote (for points logic)
    const existingVote = await prisma.vote.findUnique({
      where: { userId_ideaId: { userId: user.id, ideaId: params.id } },
    });

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

    // Award points only for NEW votes (not changes or removals)
    if (value !== 0 && !existingVote) {
      // VOTE point to voter
      await prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: 1 } },
      }).catch(() => {});

      // RECEIVE_VOTE points to the idea author
      await prisma.user.update({
        where: { id: idea.authorId },
        data: { points: { increment: 2 } },
      }).catch(() => {});
    }

    // Log activity for real-time feed (only new votes)
    if (value !== 0 && !existingVote) {
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
