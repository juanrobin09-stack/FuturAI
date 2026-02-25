"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import {
  Map,
  Trophy,
  Lightbulb,
  FlaskConical,
  FolderKanban,
  Award,
  Heart,
  Menu,
  X,
  LogIn,
  UserPlus,
  Shield,
  BarChart3,
  Users,
  MessageCircle,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import FutureAILogo from "./FutureAILogo";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import { isClerkConfigured } from "./AuthProvider";

// Sign in / Sign up links — always works, no Clerk dependency
function SignInLinks() {
  const { t } = useLanguage();
  return (
    <>
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
      >
        <LogIn className="w-3.5 h-3.5" />
        {t.nav.signIn}
      </Link>
      <Link
        href="/sign-up"
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-400 hover:to-primary-500 transition-all shadow-sm"
      >
        <UserPlus className="w-3.5 h-3.5" />
        {t.nav.signUp}
      </Link>
    </>
  );
}

// Load auth section client-only (ssr:false) to avoid Clerk SSR build errors
const ClerkAuthSection = dynamic(() => import("./ClerkAuthSection"), {
  ssr: false,
  loading: () => <SignInLinks />,
});

// Auth section — uses ClerkAuthSection when configured, otherwise static links
function AuthSection() {
  if (!isClerkConfigured) return <SignInLinks />;
  return <ClerkAuthSection />;
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { t, locale } = useLanguage();
  const moreRef = useRef<HTMLDivElement>(null);

  // Fetch current user role for admin link visibility
  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.role) setUserRole(data.user.role);
      })
      .catch(() => {});
  }, []);

  // Close "More" dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [moreOpen]);

  // Primary links — shown directly in the nav bar
  const primaryLinks = [
    { href: "/projects", label: t.nav.projects, icon: FolderKanban },
    { href: "/challenges", label: t.nav.challenges, icon: Award },
    { href: "/arena", label: t.nav.arena, icon: FlaskConical },
    { href: "/forum", label: t.nav.forum || "Forum", icon: MessageCircle },
    { href: "/leaderboard", label: t.nav.leaderboard, icon: Trophy },
  ];

  // Secondary links — inside "More" dropdown
  const secondaryLinks = [
    { href: "/ideas", label: t.nav.ideas, icon: Lightbulb },
    { href: "/reseau", label: t.nav.network || (locale === "fr" ? "R\u00e9seau" : "Network"), icon: Users },
    { href: "/impact-dashboard", label: "Impact", icon: BarChart3 },
    { href: "/manifesto", label: t.nav.manifesto, icon: Heart },
    { href: "/map", label: t.nav.map, icon: Map },
    ...(userRole === "ADMIN"
      ? [{ href: "/admin", label: "Admin", icon: Shield }]
      : []),
  ];

  // All links for mobile menu
  const allLinks = [...primaryLinks, ...secondaryLinks];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <FutureAILogo size={36} className="group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold gradient-text hidden sm:block">
              FutureAI
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap"
              >
                <link.icon className="w-4 h-4 shrink-0" />
                {link.label}
              </Link>
            ))}

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="hidden xl:inline">{locale === "fr" ? "Plus" : "More"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden py-1 z-50"
                  >
                    {secondaryLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <link.icon className="w-4 h-4 shrink-0 text-gray-500" />
                        {link.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Auth + Notifications + Language */}
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            <LanguageSwitcher />
            <AuthSection />

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-white/5"
            >
              <div className="py-3 grid grid-cols-2 gap-1">
                {allLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <link.icon className="w-4 h-4 shrink-0" />
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-white/5 py-3 px-3 flex items-center gap-3">
                <Link
                  href="/ideas/submit"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-accent-400 font-medium"
                >
                  <Lightbulb className="w-4 h-4" />
                  {t.nav.submitIdea}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
