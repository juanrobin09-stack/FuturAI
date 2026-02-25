"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Eye,
  Clock,
  Pin,
  Lock,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useLanguage } from "@/i18n";
import { timeAgo, getForumCategoryColor } from "@/lib/utils";
import ForumReplySection from "@/components/ForumReplySection";

interface PostAuthor {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

interface ForumPost {
  id: string;
  content: string;
  createdAt: string | Date;
  author: PostAuthor;
  replies: ForumPost[];
}

interface ThreadAuthor {
  username: string;
  avatarUrl?: string | null;
  country?: string | null;
}

interface ThreadDetail {
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
  posts: ForumPost[];
}

export default function ForumThreadPage() {
  const { t } = useLanguage();
  const params = useParams();
  const threadId = params.id as string;

  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!threadId) return;

    setLoading(true);
    fetch(`/api/forum/${threadId}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setThread(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [threadId]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  // 404 state
  if (notFound || !thread) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.forum.backToForum}
        </Link>
        <div className="card text-center py-16">
          <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400">
            {t.forum.noThreadsFound}
          </h3>
        </div>
      </div>
    );
  }

  const categoryColor = getForumCategoryColor(thread.category);
  const categoryLabel =
    t.forumCategories[thread.category] || thread.category;
  const postCount = thread._count.posts;

  // Separate top-level posts (no parentId) for the reply section
  const topLevelPosts = thread.posts.filter(
    (p: ForumPost & { parentId?: string | null }) => !p.parentId
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Back link */}
      <Link
        href="/forum"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.forum.backToForum}
      </Link>

      {/* Thread card */}
      <div className="card mb-8">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">
          {thread.title}
        </h1>

        {/* Author & meta */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-400">
          <span className="flex items-center gap-2">
            {thread.author.avatarUrl ? (
              <img
                src={thread.author.avatarUrl}
                alt={thread.author.username}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-500/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-primary-500/30">
                {thread.author.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-medium text-gray-200">
              {thread.author.username}
            </span>
            {thread.author.country && (
              <span className="text-gray-500">{thread.author.country}</span>
            )}
          </span>

          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(thread.createdAt, t.time)}
          </span>

          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {thread.viewCount} {t.forum.views}
          </span>

          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {postCount} {t.forum.replies}
          </span>
        </div>

        {/* Thread content */}
        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {thread.content}
        </div>
      </div>

      {/* Reply section */}
      <ForumReplySection
        threadId={thread.id}
        initialPosts={topLevelPosts}
        isLocked={thread.isLocked}
      />
    </div>
  );
}
