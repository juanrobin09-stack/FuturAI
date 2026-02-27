"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, FolderKanban, Zap, X } from "lucide-react";
import { useLanguage } from "@/i18n";
import { isClerkConfigured } from "./AuthProvider";
import Link from "next/link";

const STORAGE_KEY = "futureai-welcome-seen";

export default function WelcomeModal() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if Clerk is configured (real auth environment)
    if (!isClerkConfigured) return;

    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen) return;

    // Dynamically check auth status via Clerk
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();
        if (data?.user?.id) {
          // User is signed in and hasn't seen welcome
          setTimeout(() => setShow(true), 800);
        }
      } catch {
        // Not signed in — don't show
      }
    };

    checkAuth();
  }, []);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const pathways = [
    {
      icon: Lightbulb,
      title: t.welcome.title === t.welcome.title ? t.welcome.pathIdea : t.welcome.pathIdea,
      desc: t.welcome.pathIdeaDesc,
      href: "/ideas/submit",
      color: "from-accent-500/20 to-accent-500/5",
      iconColor: "text-accent-400",
    },
    {
      icon: FolderKanban,
      title: t.welcome.pathProject,
      desc: t.welcome.pathProjectDesc,
      href: "/projects",
      color: "from-primary-500/20 to-primary-500/5",
      iconColor: "text-primary-400",
    },
    {
      icon: Zap,
      title: t.welcome.pathArena,
      desc: t.welcome.pathArenaDesc,
      href: "/arena",
      color: "from-purple-500/20 to-purple-500/5",
      iconColor: "text-purple-400",
    },
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative glass rounded-2xl border border-white/10 shadow-2xl max-w-lg w-full overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {/* Header */}
            <div className="p-6 pb-4 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-3xl">🚀</span>
              </motion.div>
              <h2 className="text-xl font-bold gradient-text mb-2">
                {t.welcome.title}
              </h2>
              <p className="text-sm text-gray-400">{t.welcome.subtitle}</p>
            </div>

            {/* Pathways */}
            <div className="px-6 pb-2 space-y-3">
              {pathways.map((path, i) => (
                <motion.div
                  key={path.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <Link
                    href={path.href}
                    onClick={handleClose}
                    className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${path.color} border border-white/5 hover:border-white/15 transition-all group`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-800/50 flex items-center justify-center shrink-0">
                      <path.icon className={`w-5 h-5 ${path.iconColor}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm group-hover:text-white transition-colors">
                        {path.title}
                      </p>
                      <p className="text-xs text-gray-500">{path.desc}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Skip */}
            <div className="p-6 pt-4 text-center">
              <button
                onClick={handleClose}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {t.welcome.skip}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
