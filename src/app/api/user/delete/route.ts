import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, getAuthUserId } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

export const dynamic = 'force-dynamic';

// DELETE /api/user/delete — GDPR: Hard delete user and all associated data
export async function DELETE(req: NextRequest) {
  try {
    // Rate limit (auth tier — irreversible action)
    const blocked = applyRateLimit(req, "auth");
    if (blocked) return blocked;

    const user = await getCurrentUser();
    const clerkUserId = await getAuthUserId();

    // Audit log BEFORE deletion (user still exists for FK)
    await createAuditLog({
      action: "account_deleted",
      targetType: "user",
      targetId: user.id,
      performedById: user.id,
      metadata: { email: user.email, username: user.username },
    });

    // 1. Delete all data from our database
    await prisma.$transaction(async (tx) => {
      // Delete expert evaluations tied to this user's panels
      await tx.expertEvaluation.deleteMany({
        where: { panel: { userId: user.id } },
      });
      await tx.challengePanel.deleteMany({ where: { userId: user.id } });

      // Delete sandbox/arena related data
      await tx.sandboxVersion.deleteMany({ where: { authorId: user.id } });
      await tx.sandboxComment.deleteMany({ where: { userId: user.id } });
      await tx.sandboxParticipant.deleteMany({ where: { userId: user.id } });
      await tx.sandboxSession.deleteMany({ where: { creatorId: user.id } });
      await tx.activity.deleteMany({ where: { userId: user.id } });
      // Note: audit logs are NOT deleted — they survive user deletion
      // thanks to onDelete: SetNull on performedById

      // Delete the user — cascade handles: ideas, votes, contributions,
      // projectMembers, comments, notifications, badges, challengeEntries,
      // apiKeys, conflictDeclarations
      await tx.user.delete({ where: { id: user.id } });
    });

    // 2. Delete user from Clerk (if authenticated via Clerk)
    if (clerkUserId) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        await client.users.deleteUser(clerkUserId);
      } catch (err) {
        // Log but don't fail — DB deletion already succeeded
        console.error("Failed to delete Clerk user:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Account and all data permanently deleted (GDPR)",
    });
  } catch (error) {
    console.error("DELETE /api/user/delete error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
