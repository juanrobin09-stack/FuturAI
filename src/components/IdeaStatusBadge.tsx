"use client";

import { Flame, Rocket, Users, CheckCircle2, Clock } from "lucide-react";

interface Props {
  status: string;
  score: number;
  collaboratorCount: number;
  size?: "sm" | "md";
}

/**
 * Dynamic status badge for ideas.
 * Status logic:
 *  - "proposed" (default): score < 5, no collaborators
 *  - "trending": score >= 5
 *  - "in_progress": has collaborators
 *  - "completed": manually set
 */
export default function IdeaStatusBadge({ status, score, collaboratorCount, size = "md" }: Props) {
  // Compute effective status (can override DB status based on score)
  let effectiveStatus = status;
  if (status === "proposed" && score >= 5) effectiveStatus = "trending";
  if (collaboratorCount > 0 && status !== "completed") effectiveStatus = "in_progress";

  const config: Record<string, { icon: React.ComponentType<any>; label: string; className: string }> = {
    proposed: {
      icon: Clock,
      label: "Proposée",
      className: "text-gray-400 bg-gray-500/10 border-gray-500/20",
    },
    trending: {
      icon: Flame,
      label: "Tendance",
      className: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    },
    in_progress: {
      icon: Users,
      label: "En cours",
      className: "text-primary-400 bg-primary-400/10 border-primary-400/20",
    },
    completed: {
      icon: CheckCircle2,
      label: "Réalisée",
      className: "text-green-400 bg-green-400/10 border-green-400/20",
    },
  };

  const cfg = config[effectiveStatus] || config.proposed;
  const Icon = cfg.icon;

  const sizeClasses = size === "sm" ? "text-[10px] px-1.5 py-0.5 gap-1" : "text-xs px-2 py-1 gap-1.5";

  return (
    <span className={`inline-flex items-center ${sizeClasses} rounded-lg border font-medium ${cfg.className}`}>
      <Icon className={size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />
      {cfg.label}
    </span>
  );
}
