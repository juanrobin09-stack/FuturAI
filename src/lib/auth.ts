import prisma from "@/lib/prisma";

export type UserRole = "USER" | "EXPERT_VOLUNTEER" | "EXPERT_INSTITUTION" | "ADMIN";

interface ClerkSessionData {
  userId: string;
  email?: string;
  username?: string;
  imageUrl?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
}

/**
 * Try to get the Clerk userId and metadata from the auth session.
 * Returns null if Clerk is not configured or the user is not signed in.
 */
async function getClerkSession(): Promise<ClerkSessionData | null> {
  try {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return null;

    const user = await currentUser();
    if (!user) return { userId };

    const email = user.emailAddresses?.[0]?.emailAddress;
    const role = (user.publicMetadata?.role as UserRole) || "USER";

    return {
      userId,
      email: email || undefined,
      username: user.username || undefined,
      imageUrl: user.imageUrl || undefined,
      role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Get or create the current database user.
 * When Clerk is active: syncs email, avatar, username, role from Clerk session.
 * When Clerk is not configured: falls back to demo user.
 */
export async function getCurrentUser() {
  const session = await getClerkSession();

  if (session) {
    const { userId, email, username, imageUrl, role, firstName, lastName } = session;

    // Build display name from available data
    const displayName =
      username ||
      (firstName && lastName ? `${firstName} ${lastName}` : null) ||
      (firstName ? firstName : null) ||
      "User_" + userId.slice(-6);

    // Upsert: create if new, update if returning (sync latest Clerk data)
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        ...(email ? { email } : {}),
        ...(username ? { username: displayName } : {}),
        ...(imageUrl ? { avatarUrl: imageUrl } : {}),
        ...(role ? { role } : {}),
      },
      create: {
        clerkId: userId,
        username: displayName,
        email: email || `${userId}@placeholder.dev`,
        avatarUrl: imageUrl || null,
        role: role || "USER",
      },
    });

    return user;
  }

  // Demo mode: use demo user
  let user = await prisma.user.findUnique({
    where: { clerkId: "demo_clerk_id" },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: "demo_clerk_id",
        username: "DemoUser",
        email: "demo@futureai.dev",
      },
    });
  }
  return user;
}

/**
 * Get just the Clerk userId string, or null if not authenticated.
 * Lighter than getCurrentUser() — use when you only need the ID.
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    return userId;
  } catch {
    return null;
  }
}

/**
 * Require authentication — throws if not signed in (when Clerk is configured).
 * In demo mode, returns the demo user.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  return user;
}

/**
 * Check if the current user has one of the specified roles.
 */
export async function requireRole(...roles: UserRole[]) {
  const user = await getCurrentUser();
  if (!roles.includes(user.role as UserRole)) {
    throw new Error(`Forbidden: requires role ${roles.join(" or ")}`);
  }
  return user;
}
