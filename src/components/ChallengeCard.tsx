"use client";

import Link from "next/link";
import { Trophy, Clock, Users, Award } from "lucide-react";
import { motion } from "framer-motion";
import { formatDate, getChallengeCategoryColor } from "@/lib/utils";
import { useLanguage } from "@/i18n";

interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    category?: string | null;
    type: string;
    status: string;
    prize?: string | null;
    impactArea?: string | null;
    startDate: string;
    endDate: string;
    _count?: { entries: number };
  };
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const { t, locale } = useLanguage();
  const now = new Date();
  const end = new Date(challenge.endDate);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isOpen = challenge.status === "open";
  const entryCount = challenge._count?.entries ?? 0;

  const typeLabel =
    challenge.type === "weekly"
      ? t.challenges.typeWeeklyShort
      : challenge.type === "monthly"
      ? t.challenges.typeMonthlyShort
      : t.challenges.typeSpecial;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
    <Link
      href={`/challenges/${challenge.id}`}
      className="card group hover:border-accent-500/20 block transition-all relative overflow-hidden"
    >
      {/* Badges */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        {challenge.impactArea && (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium border"
            style={{
              backgroundColor: `${getChallengeCategoryColor(challenge.impactArea)}15`,
              color: getChallengeCategoryColor(challenge.impactArea),
              borderColor: `${getChallengeCategoryColor(challenge.impactArea)}30`,
            }}
          >
            {t.challengeCategories[challenge.impactArea] || challenge.impactArea}
          </span>
        )}
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          challenge.type === "weekly"
            ? "bg-primary-500/15 text-primary-400 border border-primary-500/30"
            : challenge.type === "monthly"
            ? "bg-accent-500/15 text-accent-400 border border-accent-500/30"
            : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
        }`}>
          {typeLabel}
        </span>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center shrink-0">
          <Trophy className={`w-6 h-6 ${isOpen ? "text-accent-400" : "text-gray-500"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-accent-300 transition-colors line-clamp-1">
            {challenge.title}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2 mt-1">
            {challenge.description}
          </p>
        </div>
      </div>

      {/* Prize */}
      {challenge.prize && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-accent-500/10 rounded-lg border border-accent-500/20">
          <Award className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-medium text-primary-300">{challenge.prize}</span>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {entryCount} {entryCount !== 1 ? t.challenges.participations.toLowerCase() : t.challenges.participations.toLowerCase()}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {isOpen ? t.challenges.daysLeft.replace("{n}", String(daysLeft)) : t.challenges.finished}
        </span>
        <span>{formatDate(challenge.startDate, locale)} - {formatDate(challenge.endDate, locale)}</span>
      </div>

      {/* Progress bar */}
      {isOpen && (
        <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full transition-all"
            style={{
              width: `${Math.max(5, 100 - (daysLeft / 30) * 100)}%`,
            }}
          />
        </div>
      )}
    </Link>
    </motion.div>
  );
}
