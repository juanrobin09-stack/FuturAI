"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/i18n";
import { timeAgo } from "@/lib/utils";
import BadgeUnlockToast from "./BadgeUnlockToast";

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [open, setOpen] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Badge unlock toast state
  const [badgeToast, setBadgeToast] = useState<{
    show: boolean;
    name: string;
    icon: string;
    description: string;
  }>({ show: false, name: "", icon: "", description: "" });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Initial fetch
  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {});
  }, []);

  // SSE connection for real-time updates
  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        const evtSource = new EventSource("/api/sse/notifications");
        sseRef.current = evtSource;

        evtSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "notifications" && data.newNotifications?.length > 0) {
              setNotifications((prev) => {
                const existingIds = new Set(prev.map((n) => n.id));
                const newOnes = data.newNotifications.filter(
                  (n: NotificationData) => !existingIds.has(n.id)
                );
                if (newOnes.length > 0) {
                  // Wiggle bell for new notifications
                  setWiggle(true);
                  setTimeout(() => setWiggle(false), 1000);

                  // Check for badge notifications — trigger celebration
                  for (const n of newOnes) {
                    if (n.type === "badge") {
                      const badgeMatch = n.message.match(/"([^"]+)"/);
                      if (badgeMatch) {
                        setBadgeToast({
                          show: true,
                          name: badgeMatch[1],
                          icon: "trophy",
                          description: n.message,
                        });
                      }
                    }
                  }

                  return [...newOnes, ...prev].slice(0, 50);
                }
                return prev;
              });
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
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const closeBadgeToast = useCallback(() => {
    setBadgeToast((prev) => ({ ...prev, show: false }));
  }, []);

  const typeIcons: Record<string, string> = {
    vote: "\u{1F44D}",
    comment: "\u{1F4AC}",
    contribution: "\u{1F527}",
    badge: "\u{1F3C6}",
    challenge: "\u26A1",
    project_invite: "\u{1F91D}",
    connection_request: "\u{1F91D}",
    connection_accepted: "\u2705",
    endorsement: "\u2B50",
  };

  return (
    <>
      {/* Badge unlock celebration */}
      <BadgeUnlockToast
        show={badgeToast.show}
        badgeName={badgeToast.name}
        badgeIcon={badgeToast.icon}
        badgeDescription={badgeToast.description}
        onClose={closeBadgeToast}
      />

      <div ref={ref} className="relative">
        <motion.button
          onClick={() => setOpen(!open)}
          animate={wiggle ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="relative p-2 text-gray-400 hover:text-white transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed left-4 right-4 top-[4.5rem] max-h-[70vh] lg:absolute lg:left-auto lg:right-0 lg:top-full lg:mt-2 lg:w-80 lg:max-h-96 overflow-y-auto bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50"
            >
              <div className="sticky top-0 bg-gray-900 border-b border-white/5 p-3 flex items-center justify-between">
                <span className="text-sm font-semibold">{t.notifications.title}</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    {t.notifications.markAllRead}
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  {t.notifications.noNotifications}
                </div>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${
                      !n.read ? "bg-primary-500/5" : ""
                    }`}
                    onClick={() => {
                      markRead(n.id);
                      if (n.link) window.location.href = n.link;
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{typeIcons[n.type] || "\u{1F4E2}"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{n.title}</p>
                        <p className="text-xs text-gray-400 line-clamp-1">{n.message}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{timeAgo(n.createdAt, t.time)}</p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 bg-primary-400 rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
