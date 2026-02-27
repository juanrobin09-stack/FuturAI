import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { isValidId } from "@/lib/validation";
import { createAuditLog } from "@/lib/audit";

const VALID_ROLES: UserRole[] = [
  "USER",
  "EXPERT_VOLUNTEER",
  "EXPERT_INSTITUTION",
  "ADMIN",
];

// GET /api/admin/users — List all users with roles (admin only)
export async function GET(req: NextRequest) {
  try {
    // Rate limit (auth tier — sensitive admin endpoint)
    const blocked = applyRateLimit(req, "auth");
    if (blocked) return blocked;

    await requireRole("ADMIN");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        username: true,
        email: true,
        avatarUrl: true,
        country: true,
        role: true,
        verified: true,
        points: true,
        createdAt: true,
        _count: {
          select: {
            ideas: true,
            contributions: true,
            challengeEntries: true,
            challengePanels: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    if (error?.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH /api/admin/users — Update a user's role (admin only)
export async function PATCH(req: NextRequest) {
  try {
    // Rate limit (auth tier — sensitive admin endpoint)
    const blocked = applyRateLimit(req, "auth");
    if (blocked) return blocked;

    await requireRole("ADMIN");

    const body = await req.json();
    const { userId, role, verified } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Validate userId format
    if (!isValidId(userId)) {
      return NextResponse.json({ error: "Invalid userId format" }, { status: 400 });
    }

    // Capture previous state for audit log
    const previousState = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, verified: true },
    });

    const updateData: Record<string, unknown> = {};

    if (role) {
      if (!VALID_ROLES.includes(role as UserRole)) {
        return NextResponse.json(
          { error: `Invalid role. Must be: ${VALID_ROLES.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    if (typeof verified === "boolean") {
      updateData.verified = verified;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        verified: true,
      },
    });

    // Audit log
    const admin = await requireRole("ADMIN");
    await createAuditLog({
      action: role ? "role_changed" : "user_verified",
      targetType: "user",
      targetId: userId,
      performedById: admin.id,
      metadata: {
        previousRole: previousState?.role,
        newRole: role || undefined,
        previousVerified: previousState?.verified,
        newVerified: verified !== undefined ? verified : undefined,
      },
    });

    // Sync role to Clerk public metadata if the user has a real clerkId
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { clerkId: true },
    });

    if (
      dbUser?.clerkId &&
      dbUser.clerkId !== "demo_clerk_id" &&
      role
    ) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        await client.users.updateUserMetadata(dbUser.clerkId, {
          publicMetadata: { role },
        });
      } catch (err) {
        console.error("Failed to sync role to Clerk:", err);
      }
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    if (error?.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("PATCH /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
