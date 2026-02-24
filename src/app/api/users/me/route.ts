import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/users/me — Get current authenticated user's full info
export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({
      user: {
        id: user.id,
        clerkId: user.clerkId,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        country: user.country,
        role: user.role,
        verified: user.verified,
        points: user.points,
        consentGiven: user.consentGiven,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

// PATCH /api/users/me — Update current user's username / country
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.clerkId === "demo_clerk_id") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { username, country } = body;

    // Validate username
    if (username !== undefined) {
      const trimmed = (username as string).trim();
      if (trimmed.length < 2 || trimmed.length > 30) {
        return NextResponse.json(
          { error: "Username must be between 2 and 30 characters" },
          { status: 400 }
        );
      }
      // Only allow letters, numbers, underscores, hyphens
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        return NextResponse.json(
          { error: "Username can only contain letters, numbers, _ and -" },
          { status: 400 }
        );
      }
      // Check uniqueness (case-insensitive)
      const existing = await prisma.user.findFirst({
        where: {
          username: { equals: trimmed, mode: "insensitive" },
          id: { not: user.id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, string | null> = {};
    if (username !== undefined) {
      updateData.username = (username as string).trim();
    }
    if (country !== undefined) {
      updateData.country = country ? (country as string).trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        username: updated.username,
        country: updated.country,
      },
    });
  } catch (error) {
    console.error("PATCH /api/users/me error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
