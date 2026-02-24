import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createSSEResponse } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  let userId: string;
  try {
    const user = await getCurrentUser();
    userId = user.id;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  let lastCheck = new Date();

  return createSSEResponse(async () => {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        createdAt: { gt: lastCheck },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    lastCheck = new Date();

    if (notifications.length > 0) {
      return {
        type: "notifications",
        unreadCount,
        newNotifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link,
          read: n.read,
          createdAt: n.createdAt.toISOString(),
        })),
      };
    }

    // Always send unread count even if no new notifications
    return { type: "heartbeat", unreadCount };
  }, 3000);
}
