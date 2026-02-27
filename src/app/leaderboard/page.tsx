"use client";

import { useEffect, useState, useRef } from "react";
import { Trophy, Flame, Users, Award, TrendingUp } from "lucide-react";
import { SkeletonGrid } from "@/components/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { getLevelFromPoints } from "@/lib/points";
import { useLanguage } from "@/i18n";
import Link from "next/link";
import PageTransition from "@/components/animations/PageTransition";
import FadeIn from "@/components/animations/FadeIn";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerList";
import { timeAgo } from "@/lib/utils";

interface UserRank {
  id: string;
  username: string;
  avatarUrl: string | null;
  country: string | null;
  points: number;
  _count: { ideas: number; contributions: number; projects: number };
}

interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  user: { id: string; username: string; avatarUrl?: string | null };
}

type TimeRange = "weekly" | "monthly" | "allTime";

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("allTime");
  const [countryFilter, setCountryFilter] = useState("");
  const [allCountries, setAllCountries] = useState<string[]>([]);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ leaderboard: "true" });
    if (timeRange !== "allTime") params.set("range", timeRange);
    if (countryFilter) params.set("country", countryFilter);
    fetch(`/api/users?${params}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Fetch failed");
        return r.json();
      })
      .then((data) => {
        const userList = data.users || [];
        setUsers(userList);
        // Extract unique countries for filter
        if (!countryFilter) {
          const countries = Array.from(new Set(userList.map((u: UserRank) => u.country).filter(Boolean))) as string[];
          setAllCountries(countries.sort());
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch users:", err);
        setLoading(false);
      });
  }, [timeRange, countryFilter]);

  // SSE for live activity feed
  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        const evtSource = new EventSource("/api/sse/activity");
        sseRef.current = evtSource;

        evtSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "activities" && data.activities?.length > 0) {
              setActivities((prev) => {
                const existingIds = new Set(prev.map((a) => a.id));
                const newOnes = data.activities.filter(
                  (a: ActivityEvent) => !existingIds.has(a.id)
                );
                return [...newOnes, ...prev].slice(0, 20);
              });
            }
          } catch {
            // Ignore
          }
        };

        evtSource.onerror = () => {
          evtSource.close();
          sseRef.current = null;
          reconnectTimeout = setTimeout(connect, 10000);
        };
      } catch {
        reconnectTimeout = setTimeout(connect, 30000);
      }
    };

    connect();
    return () => {
      sseRef.current?.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const activityIcons: Record<string, string> = {
    contribution: "🔧",
    vote: "👍",
    challenge_entry: "⚡",
    badge: "🏆",
    project_join: "🤝",
    sandbox: "🧪",
    comment: "💬",
    version: "📦",
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-accent-400" />
          </div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">{t.leaderboard.title}</span>
          </h1>
          <p className="text-gray-400 mt-2">{t.leaderboard.subtitle}</p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {(["weekly", "monthly", "allTime"] as const).map((range) => {
            const labels = {
              weekly: t.leaderboardTabs.weekly,
              monthly: t.leaderboardTabs.monthly,
              allTime: t.leaderboardTabs.allTime,
            };
            const isActive = timeRange === range;
            return (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {labels[range]}
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-lg bg-primary-500/20 border border-primary-500/30"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Country filter */}
        {allCountries.length > 0 && (
          <div className="flex justify-center mb-6">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="input-field w-full sm:w-auto sm:min-w-[200px] text-sm"
            >
              <option value="">{t.leaderboard.allCountries}</option>
              {allCountries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          {/* Main leaderboard */}
          <div>
            {loading ? (
              <SkeletonGrid count={6} type="list" />
            ) : (
              <>
                {users.length >= 3 && (
                  <FadeIn>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                      {users.slice(0, 3).map((user, i) => {
                        const { level, title } = getLevelFromPoints(user.points, t.levels);
                        const medals = [
                          "border-yellow-500/30 from-yellow-500/10 to-yellow-600/5",
                          "border-gray-400/30 from-gray-400/10 to-gray-500/5",
                          "border-amber-700/30 from-amber-700/10 to-amber-800/5",
                        ];
                        const medalColors = ["text-yellow-300", "text-gray-300", "text-amber-500"];
                        const sizes = ["text-2xl sm:text-4xl", "text-xl sm:text-3xl", "text-xl sm:text-3xl"];
                        return (
                          <motion.div
                            key={user.id}
                            layout
                            className={`card bg-gradient-to-b ${medals[i]} border ${
                              i === 0 ? "sm:order-2 sm:-mt-4" : i === 1 ? "sm:order-1" : "sm:order-3"
                            }`}
                          >
                            <div className="text-center">
                              <span className={`${sizes[i]} font-black ${medalColors[i]}`}>#{i + 1}</span>
                              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-base sm:text-xl font-bold text-white mx-auto mt-3">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <Link href={`/profile/${user.id}`} className="hover:underline"><h3 className="font-semibold mt-2">{user.username}</h3></Link>
                              {user.country && <p className="text-xs text-gray-500">{user.country}</p>}
                              <div className="flex items-center justify-center gap-1 mt-2">
                                <Flame className="w-4 h-4 text-accent-400" />
                                <motion.span
                                  key={user.points}
                                  initial={{ scale: 1.2 }}
                                  animate={{ scale: 1 }}
                                  className="text-xl font-bold text-accent-300"
                                >
                                  {user.points}
                                </motion.span>
                                <span className="text-xs text-gray-500">{t.common.pts}</span>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-400 mt-2 inline-block">
                                {t.common.level} {level} — {title}
                              </span>
                              <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
                                <span>{user._count.ideas} {t.leaderboard.ideas}</span>
                                <span>{user._count.contributions} {t.leaderboard.contribs}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </FadeIn>
                )}

                <StaggerContainer className="space-y-2">
                  {(users.length >= 3 ? users.slice(3) : users).map((user, i) => {
                    const rank = users.length >= 3 ? i + 4 : i + 1;
                    const { level } = getLevelFromPoints(user.points, t.levels);
                    return (
                      <StaggerItem key={user.id}>
                        <motion.div layout className="card flex items-center gap-4 py-4">
                          <span className="w-8 text-center font-bold text-gray-500 shrink-0">{rank}</span>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Link href={`/profile/${user.id}`} className="font-medium hover:underline">{user.username}</Link>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">
                                {t.common.level} {level}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                              {user.country && <span>{user.country}</span>}
                              <span>{user._count.ideas} {t.leaderboard.ideas}</span>
                              <span>{user._count.contributions} {t.leaderboard.contributions}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Flame className="w-4 h-4 text-accent-400" />
                            <motion.span
                              key={user.points}
                              initial={{ scale: 1.2, color: "#f97316" }}
                              animate={{ scale: 1, color: "#fdba74" }}
                              className="font-bold"
                            >
                              {user.points}
                            </motion.span>
                          </div>
                        </motion.div>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>

                {users.length === 0 && (
                  <div className="card text-center py-16">
                    <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400">{t.leaderboard.noUsers}</h3>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Activity Feed Sidebar */}
          <div className="space-y-4">
            <div className="card sticky top-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4 text-sm">
                <Award className="w-4 h-4 text-accent-400" />
                {t.activity?.recentActivity || "Recent Activity"}
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-auto" />
              </h3>

              {activities.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  <AnimatePresence>
                    {activities.map((activity) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        layout
                        className="flex items-start gap-2 py-2 border-b border-white/5 last:border-0"
                      >
                        <span className="text-sm shrink-0">
                          {activityIcons[activity.type] || "📢"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-300 line-clamp-2">
                            <span className="font-medium text-white">{activity.user.username}</span>{" "}
                            {activity.message.replace(activity.user.username + " ", "")}
                          </p>
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            {timeAgo(activity.createdAt, t.time)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-6">
                  <TrendingUp className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">
                    {t.activity?.recentActivity || "Activity will appear here..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
