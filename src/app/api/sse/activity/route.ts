import prisma from "@/lib/prisma";
import { createSSEResponse } from "@/lib/sse";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  // Require authentication to access activity feed
  await getCurrentUser();

  let lastCheck = new Date();

  return createSSEResponse(async () => {
    const activities = await prisma.activity.findMany({
      where: {
        createdAt: { gt: lastCheck },
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    lastCheck = new Date();

    if (activities.length > 0) {
      return {
        type: "activities",
        activities: activities.map((a) => ({
          id: a.id,
          type: a.type,
          message: a.message,
          metadata: a.metadata ? JSON.parse(a.metadata) : null,
          createdAt: a.createdAt.toISOString(),
          user: a.user,
        })),
      };
    }

    return null; // Skip if no new activities
  }, 3000);
}
