"use client";

import { Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n";

interface StreakDisplayProps {
  streak: number;
}

export default function StreakDisplay({ streak }: StreakDisplayProps) {
  const { t } = useLanguage();

  if (streak <= 0) return null;

  const isHot = streak >= 7;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/5"
        title={`${t.engagement.currentStreak}: ${streak} ${streak === 1 ? t.engagement.day : t.engagement.days}`}
      >
        <Flame
          className={`w-3.5 h-3.5 ${
            isHot
              ? "text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]"
              : "text-orange-400"
          }`}
        />
        <span
          className={`text-xs font-bold tabular-nums ${
            isHot ? "text-red-300" : "text-orange-300"
          }`}
        >
          {streak}
        </span>

        {/* Pulse effect for hot streaks */}
        {isHot && (
          <motion.div
            className="absolute inset-0 rounded-lg border border-red-400/20"
            animate={{ opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
