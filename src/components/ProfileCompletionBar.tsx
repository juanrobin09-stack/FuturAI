"use client";

import { motion } from "framer-motion";
import { User, FileText, MapPin, Camera, Link2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n";

interface ProfileCompletion {
  percent: number;
  missing: string[];
  complete: boolean;
}

interface ProfileCompletionBarProps {
  completion: ProfileCompletion;
  onFieldClick?: (field: string) => void;
}

const FIELD_CONFIG: Record<string, { icon: React.ElementType; labelKey: string }> = {
  username: { icon: User, labelKey: "addBio" }, // username is usually already filled
  bio: { icon: FileText, labelKey: "addBio" },
  country: { icon: MapPin, labelKey: "addCountry" },
  avatarUrl: { icon: Camera, labelKey: "addAvatar" },
  socialLink: { icon: Link2, labelKey: "addSocialLink" },
};

export default function ProfileCompletionBar({ completion, onFieldClick }: ProfileCompletionBarProps) {
  const { t } = useLanguage();

  // Don't show if profile is complete
  if (completion.complete) return null;

  return (
    <div className="card mb-6 border border-primary-500/10 bg-gradient-to-r from-primary-500/5 to-accent-500/5">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-primary-400 shrink-0" />
          <span className="truncate">{t.engagement.profileCompletion}</span>
        </h3>
        <span className="text-xs font-bold text-primary-400 shrink-0">{completion.percent}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-gray-800/80 overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
          initial={{ width: 0 }}
          animate={{ width: `${completion.percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Missing fields */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {completion.missing.map((field) => {
          const config = FIELD_CONFIG[field];
          if (!config) return null;
          const Icon = config.icon;
          const label = t.engagement[config.labelKey as keyof typeof t.engagement] || field;
          return (
            <button
              key={field}
              onClick={() => onFieldClick?.(field)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium text-gray-400 bg-white/5 border border-white/5 hover:border-primary-500/30 hover:text-primary-300 transition-all"
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Reward hint */}
      <p className="text-xs text-gray-500 mt-3">
        {t.engagement.profileCompleteReward}
      </p>
    </div>
  );
}
