"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MessageCircle, Plus, Search, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n";
import PageTransition from "@/components/animations/PageTransition";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerList";
import ForumThreadCard from "@/components/ForumThreadCard";
import { FORUM_CATEGORIES, type ForumCategory } from "@/lib/utils";

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

export default function ForumPage() {
  const { t } = useLanguage();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "popular">("recent");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchThreads = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("sort", sort);

    fetch(`/api/forum?${params}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Fetch failed");
        return r.json();
      })
      .then((data) => {
        setThreads(data.threads || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch forum threads:", err);
        setLoading(false);
      });
  }, [category, debouncedSearch, sort]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 sm:w-7 sm:h-7 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t.forum.title}{" "}
                <span className="gradient-text">{t.forum.titleHighlight}</span>
              </h1>
              <p className="text-gray-400 mt-1">
                {threads.length} {t.forum.count}
              </p>
            </div>
          </div>
          <Link
            href="/forum/create"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t.forum.createThread}
          </Link>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.forum.searchPlaceholder}
            className="input-field pl-11"
          />
        </div>

        {/* Sort toggle */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setSort("recent")}
            className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
              sort === "recent"
                ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                : "bg-gray-800/50 text-gray-400 border border-white/5 hover:border-white/10"
            }`}
          >
            {t.forum.sortRecent}
          </button>
          <button
            onClick={() => setSort("popular")}
            className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
              sort === "popular"
                ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                : "bg-gray-800/50 text-gray-400 border border-white/5 hover:border-white/10"
            }`}
          >
            {t.forum.sortPopular}
          </button>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setCategory("")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              category === ""
                ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                : "bg-gray-800/50 text-gray-400 border border-white/5 hover:border-white/10"
            }`}
          >
            {t.forum.allCategories}
          </button>
          {FORUM_CATEGORIES.map((cat) => {
            const isActive = category === cat.value;
            const label =
              t.forumCategories[cat.value] || cat.value;
            return (
              <button
                key={cat.value}
                onClick={() =>
                  setCategory(isActive ? "" : cat.value)
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                  isActive
                    ? ""
                    : "bg-gray-800/50 text-gray-400 border-white/5 hover:border-white/10"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                        borderColor: `${cat.color}40`,
                      }
                    : undefined
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Thread list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : threads.length > 0 ? (
          <StaggerContainer className="space-y-4">
            {threads.map((thread) => (
              <StaggerItem key={thread.id}>
                <ForumThreadCard thread={thread} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="card text-center py-16">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400">
              {t.forum.noThreadsFound}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {t.forum.noThreadsHint}
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
