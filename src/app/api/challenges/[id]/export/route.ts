import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      include: {
        entries: {
          include: {
            user: { select: { id: true, username: true, country: true } },
            project: { select: { id: true, title: true, status: true } },
            evaluations: {
              include: {
                panel: {
                  include: {
                    user: { select: { id: true, username: true, role: true } },
                  },
                },
              },
            },
          },
          orderBy: { score: "desc" },
        },
        panels: {
          include: {
            user: { select: { id: true, username: true, role: true } },
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Only admins or panel members can export challenge data
    const isPanelMember = challenge.panels.some((p) => p.user.id === user.id);
    if (user.role !== "ADMIN" && !isPanelMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build structured export
    const report = {
      exportedAt: new Date().toISOString(),
      version: "7.0.0",
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        status: challenge.status,
        category: challenge.category,
        impactArea: challenge.impactArea,
        sdgAlignment: challenge.sdgAlignment,
        geographicScope: challenge.geographicScope,
        measurableGoal: challenge.measurableGoal,
        measurableOutcome: challenge.measurableOutcome,
        evaluationCriteria: challenge.evaluationCriteria,
        verificationMethod: challenge.verificationMethod,
        estimatedBudget: challenge.estimatedBudget,
        implementationPartnerNeeded: challenge.implementationPartnerNeeded,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        createdAt: challenge.createdAt,
      },
      expertPanel: challenge.panels.map((p) => ({
        username: p.user.username,
        role: p.role,
        status: p.status,
      })),
      entries: challenge.entries.map((entry, index) => ({
        rank: index + 1,
        submittedBy: entry.user.username,
        country: entry.user.country,
        description: entry.description,
        demoUrl: entry.demoUrl,
        score: entry.score,
        linkedProject: entry.project
          ? { title: entry.project.title, status: entry.project.status }
          : null,
        evaluations: entry.evaluations.map((ev) => ({
          evaluator: ev.panel.user.username,
          evaluatorRole: ev.panel.role,
          scores: {
            technicalQuality: ev.technicalQuality,
            relevance: ev.relevance,
            feasibility: ev.feasibility,
            impactPotential: ev.impactPotential,
            documentation: ev.documentation,
          },
          comments: ev.comments,
          conflictDeclared: ev.conflictDeclared,
        })),
        submittedAt: entry.createdAt,
      })),
      summary: {
        totalEntries: challenge.entries.length,
        totalPanelMembers: challenge.panels.length,
        averageScore:
          challenge.entries.length > 0
            ? Math.round(
                challenge.entries.reduce((sum, e) => sum + e.score, 0) /
                  challenge.entries.length
              )
            : 0,
      },
    };

    return new NextResponse(JSON.stringify(report, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="challenge-report-${challenge.id}.json"`,
      },
    });
  } catch (error: unknown) {
    console.error("Challenge export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
