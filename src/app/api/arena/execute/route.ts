import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { executeAI } from "@/lib/ai-execute";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    const body = await req.json();
    const { sessionId, prompt, changelog, provider } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Verify session exists and user is participant
    const session = await prisma.sandboxSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: true,
        creator: { select: { id: true, clerkId: true } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const isParticipant = session.participants.some((p) => p.userId === user.id);
    const isCreator = session.creatorId === user.id || session.creator.clerkId === user.clerkId;
    if (!isParticipant && !isCreator) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    // Execute AI
    const result = await executeAI(user.id, provider, prompt.trim(), session.type);

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
        provider: result.provider,
        durationMs: result.durationMs,
      }, { status: result.error === "no_api_key" ? 400 : 502 });
    }

    // Save as new version
    const latestVersion = await prisma.sandboxVersion.findFirst({
      where: { sessionId },
      orderBy: { version: "desc" },
    });

    const newVersion = await prisma.$transaction(async (tx) => {
      const version = await tx.sandboxVersion.create({
        data: {
          version: (latestVersion?.version || 0) + 1,
          prompt: prompt.trim(),
          resultText: result.result || "",
          resultUrl: result.resultUrl || null,
          changelog: changelog?.trim() || null,
          authorId: user.id,
          sessionId,
        },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
        },
      });

      await tx.sandboxSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: 3 } },
      });

      await tx.activity.create({
        data: {
          type: "sandbox",
          message: `generated v${version.version} in Arena session`,
          userId: user.id,
        },
      });

      return version;
    });

    return NextResponse.json({
      success: true,
      version: newVersion,
      resultUrl: result.resultUrl || null,
      provider: result.provider,
      durationMs: result.durationMs,
    });
  } catch (error: unknown) {
    console.error("Arena execute error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
