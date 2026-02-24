"use client";

import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";
import { useLanguage } from "@/i18n";
import { timeAgo } from "@/lib/utils";

interface Version {
  id: string;
  version: number;
  prompt: string;
  resultText?: string | null;
  changelog?: string | null;
  createdAt: string;
  author: { id: string; username: string; avatarUrl?: string | null };
}

interface SandboxVersionTimelineProps {
  versions: Version[];
  activeVersionId?: string;
  onSelectVersion: (version: Version) => void;
}

export default function SandboxVersionTimeline({
  versions,
  activeVersionId,
  onSelectVersion,
}: SandboxVersionTimelineProps) {
  const { t } = useLanguage();

  if (versions.length === 0) return null;

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        {t.arenaSession.versionHistory}
      </h4>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-700" />

        {versions.map((version, index) => {
          const isActive = version.id === activeVersionId;
          return (
            <motion.button
              key={version.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectVersion(version)}
              className={`relative w-full text-left pl-8 pr-2 py-2 rounded-lg transition-all ${
                isActive
                  ? "bg-accent-500/10 border border-accent-500/20"
                  : "hover:bg-white/5"
              }`}
            >
              {/* Timeline dot */}
              <div
                className={`absolute left-1.5 top-3.5 w-3 h-3 rounded-full border-2 ${
                  isActive
                    ? "bg-accent-500 border-accent-400"
                    : "bg-gray-800 border-gray-600"
                }`}
              />

              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-bold ${isActive ? "text-accent-400" : "text-gray-300"}`}>
                  v{version.version}
                </span>
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <User className="w-2.5 h-2.5" />
                  {version.author.username}
                </span>
              </div>

              {version.changelog && (
                <p className="text-[11px] text-gray-400 line-clamp-1">{version.changelog}</p>
              )}

              <span className="text-[10px] text-gray-600 flex items-center gap-1 mt-0.5">
                <Clock className="w-2.5 h-2.5" />
                {timeAgo(version.createdAt, t.time)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
