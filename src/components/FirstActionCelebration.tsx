"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, GitBranch, FolderKanban, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { useLanguage } from "@/i18n";

interface FirstActionCelebrationProps {
  show: boolean;
  actionType: "idea" | "contribution" | "project";
  onClose: () => void;
}

const ACTION_CONFIG = {
  idea: {
    icon: Lightbulb,
    titleKey: "firstIdea" as const,
    descKey: "firstIdeaDesc" as const,
    color: "text-accent-400",
    bgColor: "from-accent-500/20 to-accent-500/5",
  },
  contribution: {
    icon: GitBranch,
    titleKey: "firstContribution" as const,
    descKey: "firstContributionDesc" as const,
    color: "text-primary-400",
    bgColor: "from-primary-500/20 to-primary-500/5",
  },
  project: {
    icon: FolderKanban,
    titleKey: "firstProject" as const,
    descKey: "firstProjectDesc" as const,
    color: "text-purple-400",
    bgColor: "from-purple-500/20 to-purple-500/5",
  },
};

export default function FirstActionCelebration({ show, actionType, onClose }: FirstActionCelebrationProps) {
  const { t } = useLanguage();
  const config = ACTION_CONFIG[actionType];
  const Icon = config.icon;

  useEffect(() => {
    if (!show) return;

    // Confetti burst
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#0d9488", "#22d3ee", "#fbbf24"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#0d9488", "#22d3ee", "#fbbf24"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative p-6 sm:p-8 rounded-2xl bg-gray-900/95 border border-white/10 shadow-2xl text-center max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sparkle ring */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <Sparkles
                  key={angle}
                  className="absolute w-3 h-3 text-amber-400/40"
                  style={{
                    transform: `rotate(${angle}deg) translateY(-70px)`,
                  }}
                />
              ))}
            </motion.div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.bgColor} flex items-center justify-center mx-auto mb-4`}
            >
              <Icon className={`w-8 h-8 ${config.color}`} />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-white mb-2"
            >
              {t.engagement[config.titleKey]}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-gray-400"
            >
              {t.engagement[config.descKey]}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
