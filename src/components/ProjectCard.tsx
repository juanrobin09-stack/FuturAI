"use client";

import Link from "next/link";
import { Users, MapPin, Clock, GitBranch, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import CategoryBadge from "./CategoryBadge";
import StatusBadge from "./StatusBadge";
import { timeAgo } from "@/lib/utils";
import { useLanguage } from "@/i18n";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    imageUrl?: string | null;
    country?: string | null;
    createdAt: string | Date;
    _count?: {
      members?: number;
      comments?: number;
      contributions?: number;
    };
    members?: Array<{
      user: { username: string; avatarUrl?: string | null };
      role: string;
    }>;
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useLanguage();
  const memberCount = project._count?.members ?? project.members?.length ?? 0;
  const commentCount = project._count?.comments ?? 0;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
    <Link
      href={`/projects/${project.id}`}
      className="card group hover:border-primary-500/20 block transition-all"
    >
      {project.imageUrl && (
        <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-800 mb-4 -mt-1">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors line-clamp-1 flex-1">
          {project.title}
        </h3>
        <StatusBadge status={project.status} />
      </div>

      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
        {project.description}
      </p>

      {/* Members avatars */}
      {project.members && project.members.length > 0 && (
        <div className="flex items-center gap-1 mb-3">
          <div className="flex -space-x-2">
            {project.members.slice(0, 4).map((m, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold text-white"
                title={`${m.user.username} (${m.role})`}
              >
                {m.user.username.charAt(0).toUpperCase()}
              </div>
            ))}
            {memberCount > 4 && (
              <div className="w-7 h-7 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-[10px] text-gray-300">
                +{memberCount - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500 ml-2">
            {memberCount} {memberCount !== 1 ? t.projects.membersPlural : t.projects.member}
          </span>
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <CategoryBadge category={project.category} />
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {memberCount}
        </span>
        {commentCount > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {commentCount}
          </span>
        )}
        {project.country && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {project.country}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {timeAgo(project.createdAt, t.time)}
        </span>
      </div>
    </Link>
    </motion.div>
  );
}
