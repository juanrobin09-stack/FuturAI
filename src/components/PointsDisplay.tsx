"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { getLevelFromPoints } from "@/lib/points";
import { useLanguage } from "@/i18n";
import AnimatedProgressBar from "./AnimatedProgressBar";

interface PointsDisplayProps {
  points: number;
  size?: "sm" | "md" | "lg";
  showLevel?: boolean;
}

export default function PointsDisplay({ points, size = "md", showLevel = true }: PointsDisplayProps) {
  const { t } = useLanguage();
  const { level, title, nextThreshold } = getLevelFromPoints(points, t.levels);
  const progress = Math.min(100, (points / nextThreshold) * 100);

  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-400">
        <Flame className="w-3 h-3" />
        {points} {t.common.pts}
      </span>
    );
  }

  return (
    <div className={`${size === "lg" ? "p-4" : "p-3"} rounded-xl bg-gradient-to-r from-accent-500/10 to-primary-500/10 border border-accent-500/20`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame className={`text-accent-400 ${size === "lg" ? "w-5 h-5" : "w-4 h-4"}`} />
          <motion.span
            key={points}
            initial={{ scale: 1.3, color: "#fb923c" }}
            animate={{ scale: 1, color: "#fdba74" }}
            transition={{ duration: 0.4 }}
            className={`font-bold ${size === "lg" ? "text-xl" : "text-base"}`}
          >
            {points}
          </motion.span>
          <span className="text-xs text-gray-500">{t.common.points}</span>
        </div>
        {showLevel && (
          <motion.span
            key={level}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xs px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-400 border border-primary-500/30"
          >
            {t.common.level} {level} — {title}
          </motion.span>
        )}
      </div>
      <AnimatedProgressBar
        progress={progress}
        nextThreshold={nextThreshold}
        currentPoints={points}
        size={size === "lg" ? "lg" : "md"}
        label={`${nextThreshold} ${t.common.pts}`}
      />
    </div>
  );
}
