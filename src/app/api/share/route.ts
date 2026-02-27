import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { POINTS } from "@/lib/points";
import { checkAndAwardBadges } from "@/lib/badges";
import { applyRateLimit } from "@/lib/rate-limit";

const DAILY_SHARE_CAP = 5;

// POST /api/share — Track a content share and award points
export async function POST(req: NextRequest) {
  try {
    const blocked = applyRateLimit(req, "write");
    if (blocked) return blocked;

    const user = await getCurrentUser();
    if (!user || user.clerkId === "demo_clerk_id") {
      return NextResponse.json({ pointsAwarded: 0 });
    }

    const body = await req.json();
    const { contentType, contentId, platform } = body;

    if (!contentType || !contentId || !platform) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Count today's shares
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayShareCount = await prisma.activity.count({
      where: {
        userId: user.id,
        type: "share",
        createdAt: { gte: todayStart },
      },
    });

    // Log the share activity
    await prisma.activity.create({
      data: {
        type: "share",
        message: `shared ${contentType} on ${platform}`,
        metadata: JSON.stringify({ contentType, contentId, platform }),
        userId: user.id,
      },
    });

    let pointsAwarded = 0;
    const dailyLimitReached = todayShareCount >= DAILY_SHARE_CAP;

    if (!dailyLimitReached) {
      // Award points
      pointsAwarded = POINTS.SHARE_CONTENT;
      await prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: pointsAwarded } },
      });

      // Check badges (async)
      checkAndAwardBadges(user.id).catch(() => {});
    }

    return NextResponse.json({
      pointsAwarded,
      dailyLimitReached: todayShareCount + 1 >= DAILY_SHARE_CAP,
      todayShares: todayShareCount + 1,
    });
  } catch (error) {
    console.error("Share tracking error:", error);
    return NextResponse.json({ pointsAwarded: 0 });
  }
}
