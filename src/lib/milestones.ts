import prisma from "@/lib/prisma";

export const POINT_MILESTONES = [100, 250, 500, 1000];

/**
 * Check if a point milestone was just crossed.
 * Creates a notification if a milestone is reached.
 * Returns the milestone number or null.
 */
export async function checkPointMilestone(
  userId: string,
  pointsBefore: number,
  pointsAfter: number
): Promise<number | null> {
  for (const milestone of POINT_MILESTONES) {
    if (pointsBefore < milestone && pointsAfter >= milestone) {
      // Create milestone notification
      await prisma.notification.create({
        data: {
          type: "milestone",
          title: `${milestone} points !`,
          message: `Vous avez atteint ${milestone} points ! Continuez comme ca.`,
          link: "/profile",
          userId,
        },
      }).catch(() => {});

      // Log activity
      await prisma.activity.create({
        data: {
          type: "milestone",
          message: `reached ${milestone} points`,
          metadata: JSON.stringify({ milestone }),
          userId,
        },
      }).catch(() => {});

      return milestone;
    }
  }
  return null;
}
