import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/challenges/:id/entries/:entryId/evaluations
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const evaluations = await prisma.expertEvaluation.findMany({
      where: { entryId: params.entryId },
      include: {
        panel: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      evaluations: evaluations.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET evaluations error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/challenges/:id/entries/:entryId/evaluations
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { technicalQuality, relevance, feasibility, impactPotential, documentation, comments, conflictDeclared } = body;

    // Validate scores
    const scores = [technicalQuality, relevance, feasibility, impactPotential, documentation];
    if (scores.some((s) => typeof s !== "number" || s < 1 || s > 10)) {
      return NextResponse.json({ error: "All scores must be between 1 and 10" }, { status: 400 });
    }

    // Verify user is an accepted panel member
    const panel = await prisma.challengePanel.findUnique({
      where: { userId_challengeId: { userId: user.id, challengeId: params.id } },
    });
    if (!panel || panel.status !== "accepted") {
      return NextResponse.json({ error: "You must be an accepted panel member" }, { status: 403 });
    }

    // Verify entry exists
    const entry = await prisma.challengeEntry.findUnique({
      where: { id: params.entryId },
    });
    if (!entry || entry.challengeId !== params.id) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const evaluation = await prisma.expertEvaluation.create({
      data: {
        technicalQuality,
        relevance,
        feasibility,
        impactPotential,
        documentation,
        comments: comments?.trim() || null,
        conflictDeclared: conflictDeclared || false,
        panelId: panel.id,
        entryId: params.entryId,
      },
    });

    // Recalculate entry score: average of all expert evaluations
    const allEvaluations = await prisma.expertEvaluation.findMany({
      where: { entryId: params.entryId },
      include: { panel: true },
    });

    let totalWeight = 0;
    let weightedSum = 0;
    for (const ev of allEvaluations) {
      const avg = (ev.technicalQuality + ev.relevance + ev.feasibility + ev.impactPotential + ev.documentation) / 5;
      const weight = ev.panel.role === "EXPERT_INSTITUTION" ? 1.5 : 1.0;
      weightedSum += avg * weight;
      totalWeight += weight;
    }
    const newScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) : 0;

    await prisma.challengeEntry.update({
      where: { id: params.entryId },
      data: { score: newScore },
    });

    return NextResponse.json(
      { ...evaluation, createdAt: evaluation.createdAt.toISOString(), updatedAt: evaluation.updatedAt.toISOString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST evaluations error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
