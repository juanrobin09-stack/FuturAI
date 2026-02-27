import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/users/activity-heatmap?userId=xxx&days=91
export async function GET(req: NextRequest) {
  try {
    const blocked = applyRateLimit(req, "read");
    if (blocked) return blocked;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const days = Math.min(parseInt(searchParams.get("days") || "91"), 365);

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Group activities by date
    const activities = await prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(
      `SELECT DATE("createdAt") as date, COUNT(*) as count
       FROM "Activity"
       WHERE "userId" = $1
       AND "createdAt" >= $2
       GROUP BY DATE("createdAt")
       ORDER BY date ASC`,
      userId,
      startDate
    );

    const heatmap = activities.map((a) => ({
      date: typeof a.date === "string" ? a.date : new Date(a.date).toISOString().slice(0, 10),
      count: Number(a.count),
    }));

    // Calculate this week and this month totals
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalThisWeek = 0;
    let totalThisMonth = 0;

    for (const day of heatmap) {
      const d = new Date(day.date);
      if (d >= weekStart) totalThisWeek += day.count;
      if (d >= monthStart) totalThisMonth += day.count;
    }

    return NextResponse.json({ heatmap, totalThisWeek, totalThisMonth });
  } catch (error) {
    console.error("Activity heatmap error:", error);
    return NextResponse.json({ heatmap: [], totalThisWeek: 0, totalThisMonth: 0 });
  }
}
