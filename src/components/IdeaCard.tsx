"use client";

import Link from "next/link";
import { MapPin, Clock, User, MessageCircle, Users } from "lucide-react";
import { motion } from "framer-motion";
import VoteButton from "./VoteButton";
import CategoryBadge from "./CategoryBadge";
import IdeaStatusBadge from "./IdeaStatusBadge";
import { timeAgo } from "@/lib/utils";
import { useLanguage } from "@/i18n";

interface IdeaCardProps {
  idea: {
    id: string;
    title: string;
    description: string;
    category: string;
    imageUrl?: string | null;
    country?: string | null;
    status?: string;
    createdAt: string | Date;
    author: {
      username: string;
      avatarUrl?: string | null;
    };
    _count?: { votes: number };
    score?: number;
    commentCount?: number;
    collaboratorCount?: number;
  };
  userVote?: number;
  rank?: number;
}

export default function IdeaCard({ idea, userVote = 0, rank }: IdeaCardProps) {
  const { t } = useLanguage();
  const score = idea.score ?? 0;
  const commentCount = idea.commentCount ?? 0;
  const collaboratorCount = idea.collaboratorCount ?? 0;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="card group hover:border-primary-500/20 flex gap-3 sm:gap-4">
      {/* Vote */}
      <VoteButton ideaId={idea.id} initialScore={score} initialUserVote={userVote} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3 mb-2">
          {rank && (
            <span className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center text-sm font-bold text-primary-300">
              #{rank}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Link
                href={`/ideas/${idea.id}`}
                className="text-base sm:text-lg font-semibold text-white hover:text-primary-300 transition-colors line-clamp-1"
              >
                {idea.title}
              </Link>
              <IdeaStatusBadge
                status={idea.status || "proposed"}
                score={score}
                collaboratorCount={collaboratorCount}
                size="sm"
              />
            </div>
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">
              {idea.description}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
          <CategoryBadge category={idea.category} />
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {idea.author.username}
          </span>
          {idea.country && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {idea.country}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(idea.createdAt, t.time)}
          </span>
          {commentCount > 0 && (
            <span className="flex items-center gap-1 text-primary-400/70">
              <MessageCircle className="w-3 h-3" />
              {commentCount}
            </span>
          )}
          {collaboratorCount > 0 && (
            <span className="flex items-center gap-1 text-accent-400/70">
              <Users className="w-3 h-3" />
              {collaboratorCount}
            </span>
          )}
        </div>
      </div>

      {/* Thumbnail */}
      {idea.imageUrl && (
        <div className="hidden sm:block shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-800">
          <img
            src={idea.imageUrl}
            alt={idea.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </motion.div>
  );
}
