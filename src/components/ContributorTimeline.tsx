"use client";

import { useLanguage } from "@/i18n";
import { formatDate } from "@/lib/utils";

interface Version {
  id: string;
  version: number;
  prompt: string;
  changelog?: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
}

interface ContributorTimelineProps {
  versions: Version[];
}

const AUTHOR_COLORS = [
  "from-primary-500 to-accent-500",
  "from-purple-500 to-pink-500",
  "from-green-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-blue-500 to-indigo-500",
];

export default function ContributorTimeline({ versions }: ContributorTimelineProps) {
  const { t, locale } = useLanguage();

  if (versions.length === 0) {
    return <p className="text-sm text-gray-500">{t.arenaEnhanced.noTimeline}</p>;
  }

  // Sort by version ascending for timeline
  const sorted = [...versions].sort((a, b) => a.version - b.version);

  // Assign colors by unique author
  const authorIds = Array.from(new Set(sorted.map((v) => v.author.id)));
  const authorColorMap = new Map<string, string>();
  authorIds.forEach((id, i) => {
    authorColorMap.set(id, AUTHOR_COLORS[i % AUTHOR_COLORS.length]);
  });

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />

      <div className="space-y-4">
        {sorted.map((v) => {
          const colorClass = authorColorMap.get(v.author.id) || AUTHOR_COLORS[0];
          return (
            <div key={v.id} className="relative pl-10">
              {/* Dot */}
              <div
                className={`absolute left-2.5 top-1 w-3 h-3 rounded-full bg-gradient-to-br ${colorClass}`}
              />

              <div className="bg-gray-800/30 rounded-lg p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-[10px] font-bold text-white`}
                  >
                    {v.author.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{v.author.username}</span>
                  <span className="text-xs text-gray-500">v{v.version}</span>
                  <span className="text-xs text-gray-600 ml-auto">{formatDate(v.createdAt, locale)}</span>
                </div>
                {v.changelog && (
                  <p className="text-xs text-gray-400 line-clamp-2">{v.changelog}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
