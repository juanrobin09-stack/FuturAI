import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET — list conflict declarations for a challenge
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get("challengeId");

    const where = challengeId ? { challengeId } : {};

    const declarations = await prisma.conflictDeclaration.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, role: true } },
        challenge: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ declarations });
  } catch {
    return NextResponse.json({ declarations: [] });
  }
}

// POST — submit a conflict-of-interest declaration
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { challengeId, description } = body;

    if (!challengeId || !description?.trim()) {
      return NextResponse.json(
        { error: "challengeId and description are required" },
        { status: 400 }
      );
    }

    if (description.length > 2000) {
      return NextResponse.json(
        { error: "Description too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    // Verify challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const declaration = await prisma.conflictDeclaration.upsert({
      where: {
        userId_challengeId: { userId: user.id, challengeId },
      },
      update: { description: description.trim() },
      create: {
        userId: user.id,
        challengeId,
        description: description.trim(),
      },
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        action: "conflict_declared",
        targetType: "challenge",
        targetId: challengeId,
        performedById: user.id,
        metadata: JSON.stringify({ description: description.trim() }),
      },
    });

    return NextResponse.json(declaration, { status: 201 });
  } catch (error: unknown) {
    console.error("Conflict declaration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
