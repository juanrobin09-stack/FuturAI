/**
 * FutureAI V7 — Impact Index Computation
 *
 * Transparent, deterministic scoring for project impact assessment.
 * All weights and formulas are public (see /public-methodology).
 */

interface ProjectImpactInput {
  problemSeverity?: number | null;       // 1-10
  populationAffected?: string | null;    // text estimate
  geographicScope?: string | null;       // local, regional, national, continental, global
  implementationReadiness?: number | null; // IRL 1-9
  scalabilityPotential?: number | null;  // 1-5
}

export interface ImpactBreakdown {
  severityScore: number;    // 0-25
  reachScore: number;       // 0-25
  readinessScore: number;   // 0-25
  scalabilityScore: number; // 0-25
}

export interface ImpactResult {
  impactIndex: number;      // 0-100
  breakdown: ImpactBreakdown;
  tier: "exploratory" | "promising" | "high-impact" | "transformative";
}

// Geographic scope weights
const SCOPE_WEIGHTS: Record<string, number> = {
  local: 0.2,
  regional: 0.4,
  national: 0.6,
  continental: 0.8,
  global: 1.0,
};

// IRL (Implementation Readiness Level) labels
export const IRL_LABELS: Record<number, string> = {
  1: "Basic principles observed",
  2: "Technology concept formulated",
  3: "Experimental proof of concept",
  4: "Technology validated in lab",
  5: "Technology validated in relevant environment",
  6: "System demonstrated in relevant environment",
  7: "System prototype in operational environment",
  8: "System complete and qualified",
  9: "System proven in operational environment",
};

// SDG goal definitions
export const SDG_GOALS: Record<number, { name: string; color: string }> = {
  1: { name: "No Poverty", color: "#E5243B" },
  2: { name: "Zero Hunger", color: "#DDA63A" },
  3: { name: "Good Health and Well-Being", color: "#4C9F38" },
  4: { name: "Quality Education", color: "#C5192D" },
  5: { name: "Gender Equality", color: "#FF3A21" },
  6: { name: "Clean Water and Sanitation", color: "#26BDE2" },
  7: { name: "Affordable and Clean Energy", color: "#FCC30B" },
  8: { name: "Decent Work and Economic Growth", color: "#A21942" },
  9: { name: "Industry, Innovation and Infrastructure", color: "#FD6925" },
  10: { name: "Reduced Inequalities", color: "#DD1367" },
  11: { name: "Sustainable Cities and Communities", color: "#FD9D24" },
  12: { name: "Responsible Consumption and Production", color: "#BF8B2E" },
  13: { name: "Climate Action", color: "#3F7E44" },
  14: { name: "Life Below Water", color: "#0A97D9" },
  15: { name: "Life on Land", color: "#56C02B" },
  16: { name: "Peace, Justice and Strong Institutions", color: "#00689D" },
  17: { name: "Partnerships for the Goals", color: "#19486A" },
};

/**
 * Compute the Impact Index for a project.
 *
 * Formula:
 *   impactIndex = severityScore(25%) + reachScore(25%) + readinessScore(25%) + scalabilityScore(25%)
 *
 * Each dimension normalized to 0–25 scale.
 */
export function computeImpactIndex(project: ProjectImpactInput): ImpactResult {
  // Severity: 1-10 → 0-25
  const severity = project.problemSeverity ?? 0;
  const severityScore = Math.min(25, (severity / 10) * 25);

  // Reach: geographic scope factor 0-1 → 0-25
  const scopeWeight = SCOPE_WEIGHTS[project.geographicScope || ""] ?? 0;
  const reachScore = Math.min(25, scopeWeight * 25);

  // Readiness: IRL 1-9 → 0-25
  const readiness = project.implementationReadiness ?? 0;
  const readinessScore = Math.min(25, (readiness / 9) * 25);

  // Scalability: 1-5 → 0-25
  const scalability = project.scalabilityPotential ?? 0;
  const scalabilityScore = Math.min(25, (scalability / 5) * 25);

  const impactIndex = Math.round(severityScore + reachScore + readinessScore + scalabilityScore);

  let tier: ImpactResult["tier"];
  if (impactIndex >= 75) tier = "transformative";
  else if (impactIndex >= 50) tier = "high-impact";
  else if (impactIndex >= 25) tier = "promising";
  else tier = "exploratory";

  return {
    impactIndex,
    breakdown: {
      severityScore: Math.round(severityScore * 10) / 10,
      reachScore: Math.round(reachScore * 10) / 10,
      readinessScore: Math.round(readinessScore * 10) / 10,
      scalabilityScore: Math.round(scalabilityScore * 10) / 10,
    },
    tier,
  };
}

/**
 * Tier display configuration
 */
export const IMPACT_TIERS = {
  exploratory: { label: "Exploratory", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" },
  promising: { label: "Promising", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  "high-impact": { label: "High Impact", color: "text-accent-400", bg: "bg-accent-500/10", border: "border-accent-500/20" },
  transformative: { label: "Transformative", color: "text-primary-400", bg: "bg-primary-500/10", border: "border-primary-500/20" },
};
