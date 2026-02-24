"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/i18n";

interface LiveChallengeUpdatesProps {
  challengeId: string;
  initialEntryCount: number;
}

interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  user: { username: string };
  createdAt: string;
}

export default function LiveChallengeUpdates({
  challengeId,
  initialEntryCount,
}: LiveChallengeUpdatesProps) {
  const { t } = useLanguage();
  const [liveEntryCount, setLiveEntryCount] = useState(initialEntryCount);
  const [recentActivities, setRecentActivities] = useState<ActivityEvent[]>([]);
  const sseRef = useRef<EventSource | null>(null);

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
              // Filter for this challenge's activities
              const challengeActivities = data.activities.filter(
                (a: ActivityEvent & { metadata?: { challengeId?: string } }) => {
                  try {
                    const meta = typeof a === "object" ? a : null;
                    return meta?.type === "challenge_entry" || meta?.type === "vote";
                  } catch {
                    return false;
                  }
                }
              );

              if (challengeActivities.length > 0) {
                setRecentActivities((prev) => {
                  const existingIds = new Set(prev.map((a) => a.id));
                  const newOnes = challengeActivities.filter(
                    (a: ActivityEvent) => !existingIds.has(a.id)
                  );

                  if (newOnes.length > 0) {
                    // Show toast for new entries
                    for (const activity of newOnes) {
                      if (activity.type === "challenge_entry") {
                        toast(
                          `${activity.user.username} ${t.activity?.enteredChallenge || "entered the challenge"}!`,
                          { icon: "⚡" }
                        );
                        setLiveEntryCount((c) => c + 1);
                      }
                    }
                  }

                  return [...newOnes, ...prev].slice(0, 10);
                });
              }
            }
          } catch {
            // Ignore parse errors
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
  }, [challengeId, t]);

  return (
    <div className="space-y-3">
      {/* Live stats bar */}
      <motion.div
        layout
        className="flex items-center gap-4 p-3 rounded-xl bg-accent-500/5 border border-accent-500/10"
      >
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-gray-400">Live</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          <Users className="w-4 h-4 text-primary-400" />
          <motion.span
            key={liveEntryCount}
            initial={{ scale: 1.3, color: "#f97316" }}
            animate={{ scale: 1, color: "#d1d5db" }}
            className="font-bold"
          >
            {liveEntryCount}
          </motion.span>
          <span className="text-gray-500 text-xs">
            {t.challenges?.participations || "entries"}
          </span>
        </div>

        {recentActivities.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Zap className="w-3 h-3 text-accent-400" />
            <span>{recentActivities.length} recent</span>
          </div>
        )}
      </motion.div>

      {/* Recent activity feed */}
      <AnimatePresence>
        {recentActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1 overflow-hidden"
          >
            {recentActivities.slice(0, 5).map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-gray-800/30 text-xs"
              >
                <TrendingUp className="w-3 h-3 text-accent-400 shrink-0" />
                <span className="text-gray-300 truncate">{activity.message}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
