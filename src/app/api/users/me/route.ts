import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { updateLoginStreak } from "@/lib/streaks";
import { getProfileCompletion } from "@/lib/profile-completion";
import { POINTS } from "@/lib/points";
import { checkAndAwardBadges } from "@/lib/badges";

// GET /api/users/me — Get current authenticated user's full info
export async function GET(req: NextRequest) {
  try {
    // Rate limit
    const blocked = applyRateLimit(req, "read");
    if (blocked) return blocked;

    const user = await getCurrentUser();
    // Don't expose demo user to the client — treat as unauthenticated
    if (!user || user.clerkId === "demo_clerk_id") {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Update login streak (awards daily points, non-blocking on error)
    const streakInfo = await updateLoginStreak(user.id).catch(() => ({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      pointsAwarded: 0,
      isNewDay: false,
    }));

    // Compute profile completion
    const profileCompletion = getProfileCompletion(user);

    return NextResponse.json({
      user: {
        id: user.id,
        clerkId: user.clerkId,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        country: user.country,
        bio: user.bio,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        websiteUrl: user.websiteUrl,
        role: user.role,
        verified: user.verified,
        points: user.points + streakInfo.pointsAwarded,
        consentGiven: user.consentGiven,
        createdAt: user.createdAt,
        // Engagement data
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        streakPointsAwarded: streakInfo.pointsAwarded,
        isNewDay: streakInfo.isNewDay,
        profileCompletion,
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

// PATCH /api/users/me — Update current user's profile
export async function PATCH(req: NextRequest) {
  try {
    // Rate limit
    const blocked = applyRateLimit(req, "write");
    if (blocked) return blocked;

    const user = await getCurrentUser();
    if (!user || user.clerkId === "demo_clerk_id") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { username, country, bio, avatarUrl, githubUrl, linkedinUrl, websiteUrl } = body;

    // Validate username
    if (username !== undefined) {
      const trimmed = (username as string).trim();
      if (trimmed.length < 2 || trimmed.length > 30) {
        return NextResponse.json(
          { error: "Username must be between 2 and 30 characters" },
          { status: 400 }
        );
      }
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

    // Validate bio
    if (bio !== undefined && bio !== null) {
      if (typeof bio === "string" && bio.trim().length > 500) {
        return NextResponse.json(
          { error: "Bio must be 500 characters or less" },
          { status: 400 }
        );
      }
    }

    // Validate avatarUrl
    if (avatarUrl !== undefined && avatarUrl !== null && avatarUrl !== "") {
      if (typeof avatarUrl === "string" && !avatarUrl.startsWith("https://")) {
        return NextResponse.json(
          { error: "Avatar URL must start with https://" },
          { status: 400 }
        );
      }
      if (typeof avatarUrl === "string" && avatarUrl.length > 500) {
        return NextResponse.json(
          { error: "Avatar URL too long" },
          { status: 400 }
        );
      }
    }

    // Validate GitHub URL
    if (githubUrl !== undefined && githubUrl !== null && githubUrl !== "") {
      if (typeof githubUrl === "string" && !githubUrl.startsWith("https://github.com/")) {
        return NextResponse.json(
          { error: "GitHub URL must start with https://github.com/" },
          { status: 400 }
        );
      }
    }

    // Validate LinkedIn URL
    if (linkedinUrl !== undefined && linkedinUrl !== null && linkedinUrl !== "") {
      if (
        typeof linkedinUrl === "string" &&
        !linkedinUrl.startsWith("https://linkedin.com/") &&
        !linkedinUrl.startsWith("https://www.linkedin.com/")
      ) {
        return NextResponse.json(
          { error: "LinkedIn URL must start with https://linkedin.com/ or https://www.linkedin.com/" },
          { status: 400 }
        );
      }
    }

    // Validate website URL
    if (websiteUrl !== undefined && websiteUrl !== null && websiteUrl !== "") {
      if (typeof websiteUrl === "string" && !websiteUrl.startsWith("https://")) {
        return NextResponse.json(
          { error: "Website URL must start with https://" },
          { status: 400 }
        );
      }
      if (typeof websiteUrl === "string" && websiteUrl.length > 500) {
        return NextResponse.json(
          { error: "Website URL too long" },
          { status: 400 }
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
    if (bio !== undefined) {
      updateData.bio = bio ? (bio as string).trim() : null;
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl ? (avatarUrl as string).trim() : null;
    }
    if (githubUrl !== undefined) {
      updateData.githubUrl = githubUrl ? (githubUrl as string).trim() : null;
    }
    if (linkedinUrl !== undefined) {
      updateData.linkedinUrl = linkedinUrl ? (linkedinUrl as string).trim() : null;
    }
    if (websiteUrl !== undefined) {
      updateData.websiteUrl = websiteUrl ? (websiteUrl as string).trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Check if profile just became 100% complete → award bonus
    const completion = getProfileCompletion(updated);
    let profileBonusAwarded = false;
    if (completion.complete) {
      // Check if bonus already awarded
      const alreadyAwarded = await prisma.activity.findFirst({
        where: { userId: user.id, type: "profile_complete" },
      });
      if (!alreadyAwarded) {
        await prisma.user.update({
          where: { id: user.id },
          data: { points: { increment: POINTS.PROFILE_COMPLETE } },
        });
        await prisma.activity.create({
          data: {
            type: "profile_complete",
            message: "completed their profile",
            userId: user.id,
          },
        });
        profileBonusAwarded = true;
        checkAndAwardBadges(user.id).catch(() => {});
      }
    }

    return NextResponse.json({
      user: {
        id: updated.id,
        username: updated.username,
        country: updated.country,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        githubUrl: updated.githubUrl,
        linkedinUrl: updated.linkedinUrl,
        websiteUrl: updated.websiteUrl,
        profileCompletion: completion,
        profileBonusAwarded,
      },
    });
  } catch (error) {
    console.error("PATCH /api/users/me error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
