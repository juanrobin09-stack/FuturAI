"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, Eye, Clock, Pin, Lock } from "lucide-react";
import { timeAgo, getForumCategoryColor } from "@/lib/utils";
import { useLanguage } from "@/i18n";

interface ThreadAuthor {
  username: string;
  avatarUrl?: string | null;
}

interface ThreadPost {
  author: { username: string };
  createdAt: string | Date;
}

interface ForumThread {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  author: ThreadAuthor;
  _count: { posts: number };
  posts: ThreadPost[];
}

interface ForumThreadCardProps {
  thread: ForumThread;
}

export default function ForumThreadCard({ thread }: ForumThreadCardProps) {
  const { t } = useLanguage();
  const postCount = thread._count.posts;
  const lastPost = thread.posts.length > 0 ? thread.posts[0] : null;
  const categoryColor = getForumCategoryColor(thread.category);
  const categoryLabel =
    t.forumCategories[thread.category] || thread.category;
  const activityWidth = `${Math.min(postCount / 20, 1) * 100}%`;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="card hover:border-primary-500/20 transition-all"
    >
      {/* Top: badges */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="px-2.5 py-0.5 rounded-full text-xs font-medium border"
          style={{
            backgroundColor: `${categoryColor}15`,
            color: categoryColor,
            borderColor: `${categoryColor}30`,
          }}
        >
          {categoryLabel}
        </span>
        {thread.isPinned && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Pin className="w-3 h-3" />
            {t.forum.pinnedThread}
          </span>
        )}
        {thread.isLocked && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400 border border-gray-500/30">
            <Lock className="w-3 h-3" />
            {t.forum.lockedThread}
          </span>
        )}
      </div>

      {/* Title */}
      <Link
        href={`/forum/${thread.id}`}
        className="text-lg font-bold text-white hover:text-primary-300 transition-colors line-clamp-1 block"
      >
        {thread.title}
      </Link>

      {/* Content preview */}
      <p className="text-gray-400 text-sm mt-1 line-clamp-2">
        {thread.content}
      </p>

      {/* Bottom row: meta */}
      <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-gray-500">
        {/* Author */}
        <span className="flex items-center gap-2">
          {thread.author.avatarUrl ? (
            <img
              src={thread.author.avatarUrl}
              alt={thread.author.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
              {thread.author.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium text-gray-300">
            {thread.author.username}
          </span>
        </span>

        {/* Created at */}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {timeAgo(thread.createdAt, t.time)}
        </span>

        {/* Reply count */}
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {postCount} {t.forum.replies}
        </span>

        {/* View count */}
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {thread.viewCount} {t.forum.views}
        </span>
      </div>

      {/* Last activity */}
      {lastPost && (
        <div className="mt-2 text-xs text-gray-500">
          {t.forum.lastActivity}: {lastPost.author.username} &middot;{" "}
          {timeAgo(lastPost.createdAt, t.time)}
        </div>
      )}

      {/* Activity bar */}
      {postCount > 0 && (
        <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all"
            style={{ width: activityWidth }}
          />
        </div>
      )}
    </motion.div>
  );
}
