"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  nextThreshold: number;
  currentPoints: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export default function AnimatedProgressBar({
  progress,
  nextThreshold,
  currentPoints,
  size = "md",
  label,
}: AnimatedProgressBarProps) {
  const [displayedPoints, setDisplayedPoints] = useState(0);
  const heights = { sm: "h-1", md: "h-1.5", lg: "h-2.5" };

  // Counter animation
  useEffect(() => {
    const duration = 1000;
    const start = displayedPoints;
    const diff = currentPoints - start;
    if (diff === 0) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayedPoints(Math.round(start + diff * eased));

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [currentPoints]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <div className={`flex-1 bg-gray-800 rounded-full overflow-hidden ${heights[size]} relative`}>
          {/* Animated fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
            className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full relative"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 progress-shimmer rounded-full" />

            {/* Glow dot at end */}
            {progress > 5 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg shadow-accent-500/50" />
            )}
          </motion.div>
        </div>
        <span className="text-[10px] text-gray-500 shrink-0 tabular-nums">
          {label || `${nextThreshold} pts`}
        </span>
      </div>
    </div>
  );
}
