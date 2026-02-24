import prisma from "@/lib/prisma";

export interface ImpactBreakdown {
  expertScore: number;
  contributionDepth: number;
  collaborationIndex: number;
  solutionMaturity: number;
  totalImpactScore: number;
}

export async function calculateImpactScore(userId: string): Promise<ImpactBreakdown> {
  // 1. Expert Score: weighted avg of ExpertEvaluation scores
  const panels = await prisma.challengePanel.findMany({
    where: { evaluations: { some: {} } },
    include: {
      evaluations: {
        where: { entry: { userId } },
      },
    },
  });

  let expertScore = 0;
  if (panels.length > 0) {
    let totalWeight = 0;
    let weightedSum = 0;
    for (const panel of panels) {
      for (const ev of panel.evaluations) {
        const avg =
          (ev.technicalQuality + ev.relevance + ev.feasibility + ev.impactPotential + ev.documentation) / 5;
        const weight = panel.role === "EXPERT_INSTITUTION" ? 1.5 : 1.0;
        weightedSum += avg * weight;
        totalWeight += weight;
      }
    }
    if (totalWeight > 0) {
      expertScore = Math.min(100, (weightedSum / totalWeight) * 10);
    }
  }

  // 2. Contribution Depth: count * 2 (max 80) + unique types * 4 (max 20)
  const contributions = await prisma.contribution.findMany({
    where: { userId },
    select: { type: true },
  });
  const contribCount = Math.min(80, contributions.length * 2);
  const uniqueTypes = new Set(contributions.map((c) => c.type)).size;
  const contribTypes = Math.min(20, uniqueTypes * 4);
  const contributionDepth = contribCount + contribTypes;

  // 3. Collaboration Index: projects joined * 10 (max 50) + arena sessions * 5 (max 50)
  const projectCount = await prisma.projectMember.count({ where: { userId } });
  const sessionCount = await prisma.sandboxParticipant.count({ where: { userId } });
  const collaborationIndex = Math.min(50, projectCount * 10) + Math.min(50, sessionCount * 5);

  // 4. Solution Maturity: arena versions * 5 (max 40) + project versions * 5 (max 30) + completed projects * 10 (max 30)
  const arenaVersions = await prisma.sandboxVersion.count({ where: { authorId: userId } });
  const projectVersions = await prisma.projectVersion.count({
    where: { project: { members: { some: { userId } } } },
  });
  const completedProjects = await prisma.project.count({
    where: { status: "completed", members: { some: { userId } } },
  });
  const solutionMaturity =
    Math.min(40, arenaVersions * 5) +
    Math.min(30, projectVersions * 5) +
    Math.min(30, completedProjects * 10);

  // Total: 25% each dimension
  const totalImpactScore = Math.round(
    expertScore * 0.25 +
    contributionDepth * 0.25 +
    collaborationIndex * 0.25 +
    solutionMaturity * 0.25
  );

  return {
    expertScore: Math.round(expertScore),
    contributionDepth: Math.round(contributionDepth),
    collaborationIndex: Math.round(collaborationIndex),
    solutionMaturity: Math.round(solutionMaturity),
    totalImpactScore,
  };
}
