import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

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
