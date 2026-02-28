import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

/**
 * Verify Svix webhook signature when CLERK_WEBHOOK_SECRET is set.
 * Falls back to unverified processing for local dev.
 */
async function verifyWebhook(
  req: NextRequest
): Promise<Record<string, unknown> | null> {
  const bodyText = await req.text();

  if (!WEBHOOK_SECRET) {
    // BLOCK unverified webhooks in production
    if (process.env.NODE_ENV === "production") {
      console.error(
        "CRITICAL: CLERK_WEBHOOK_SECRET is not set in production. Rejecting webhook."
      );
      return null;
    }
    // Dev-only fallback: accept unverified (local development)
    console.warn(
      "[DEV] Accepting unverified webhook — CLERK_WEBHOOK_SECRET not set"
    );
    try {
      return JSON.parse(bodyText);
    } catch {
      return null;
    }
  }

  // Verified path (production + dev when secret is configured)
  try {
    const { Webhook } = await import("svix");
    const wh = new Webhook(WEBHOOK_SECRET);
    const headers = {
      "svix-id": req.headers.get("svix-id") || "",
      "svix-timestamp": req.headers.get("svix-timestamp") || "",
      "svix-signature": req.headers.get("svix-signature") || "",
    };
    const payload = wh.verify(bodyText, headers);
    return payload as Record<string, unknown>;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return null;
  }
}

// POST /api/webhooks/clerk — Clerk webhook handler
// Handles user.created, user.updated, user.deleted events
export async function POST(req: NextRequest) {
  try {
    const body = await verifyWebhook(req);
    if (!body) {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    const type = body.type as string;
    const data = body.data as Record<string, any>;

    // ─── User Created / Updated ──────────────────────────
    if (type === "user.created" || type === "user.updated") {
      const {
        id,
        username,
        email_addresses,
        image_url,
        first_name,
        last_name,
        public_metadata,
      } = data;
      const email = email_addresses?.[0]?.email_address;

      if (!email) {
        return NextResponse.json({ error: "No email" }, { status: 400 });
      }

      const displayName =
        username ||
        (first_name && last_name
          ? `${first_name} ${last_name}`
          : null) ||
        first_name ||
        "User_" + id.slice(-6);

      const role = public_metadata?.role || "USER";

      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          username: displayName,
          email,
          avatarUrl: image_url || null,
          role,
        },
        create: {
          clerkId: id,
          username: displayName,
          email,
          avatarUrl: image_url || null,
          role,
        },
      });

      return NextResponse.json({ success: true });
    }

    // ─── User Deleted (cascade) ──────────────────────────
    if (type === "user.deleted") {
      const { id } = data;
      const user = await prisma.user.findUnique({ where: { clerkId: id } });

      if (user) {
        await prisma.$transaction(async (tx) => {
          await tx.expertEvaluation.deleteMany({
            where: { panel: { userId: user.id } },
          });
          await tx.challengePanel.deleteMany({ where: { userId: user.id } });
          await tx.sandboxVersion.deleteMany({ where: { authorId: user.id } });
          await tx.sandboxComment.deleteMany({ where: { userId: user.id } });
          await tx.sandboxParticipant.deleteMany({
            where: { userId: user.id },
          });
          await tx.sandboxSession.deleteMany({
            where: { creatorId: user.id },
          });
          await tx.activity.deleteMany({ where: { userId: user.id } });
          // Note: audit logs are preserved (onDelete: SetNull sets performedById to null)
          await tx.user.delete({ where: { id: user.id } });
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Clerk webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
