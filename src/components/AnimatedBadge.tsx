"use client";

import { motion } from "framer-motion";
import { Trophy, Star, Users, Rocket, Zap, Target, Award, Flame, Sparkles, Globe, Crown, GitMerge, Medal, Code } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  users: Users,
  rocket: Rocket,
  zap: Zap,
  target: Target,
  award: Award,
  flame: Flame,
  sparkles: Sparkles,
  "thumbs-up": Star,
  code: Code,
  globe: Globe,
  crown: Crown,
  "git-merge": GitMerge,
  medal: Medal,
};

interface AnimatedBadgeProps {
  badge: {
    name: string;
    description: string;
    icon: string;
  };
  size?: "sm" | "md";
  isNew?: boolean;
}

export default function AnimatedBadge({ badge, size = "md", isNew = false }: AnimatedBadgeProps) {
  const Icon = iconMap[badge.icon] || Star;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20 cursor-default transition-all hover:border-accent-500/30 hover:shadow-lg hover:shadow-accent-500/5 ${
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      } ${isNew ? "animate-pulse" : ""}`}
    >
      {/* Shine sweep effect on hover */}
      <div className="absolute inset-0 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 badge-shine" />
      </div>

      <Icon className={`text-accent-400 ${size === "sm" ? "w-3 h-3" : "w-4 h-4"} relative z-10`} />
      <span className="font-medium text-primary-300 relative z-10">{badge.name}</span>

      {/* New badge pulse indicator */}
      {isNew && (
        <span className="w-2 h-2 bg-accent-500 rounded-full animate-ping absolute -top-0.5 -right-0.5" />
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 border border-white/10 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
        {badge.description}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 border-r border-b border-white/10 rotate-45 -mt-1" />
      </div>
    </motion.div>
  );
}
