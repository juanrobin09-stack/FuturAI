"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
  Shield,
  BarChart3,
} from "lucide-react";
import FutureAILogo from "./FutureAILogo";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";

// Auth section — always shows sign-in/sign-up, replaces with UserButton when logged in
function AuthSection() {
  const { t } = useLanguage();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [UserButton, setUserButton] = useState<any>(null);

  useEffect(() => {
    import("@clerk/nextjs")
      .then((mod) => {
        const clerk = (window as any).__clerk;
        if (clerk?.user) {
          setIsSignedIn(true);
          setUserButton(() => mod.UserButton);
        }
        if (clerk) {
          clerk.addListener?.((state: any) => {
            if (state?.user) {
              setIsSignedIn(true);
              setUserButton(() => mod.UserButton);
            }
          });
        }
      })
      .catch(() => {});
  }, []);

  if (isSignedIn && UserButton) {
    return (
      <>
        <Link href="/ideas/submit" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-400 hover:to-accent-500 transition-all">
          {t.nav.submitIdea}
        </Link>
        <UserButton
          afterSignOutUrl="/"
          appearance={{ elements: { avatarBox: "w-8 h-8 rounded-lg" } }}
        />
      </>
    );
  }

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
        {t.nav.signUp}
      </Link>
    </>
  );
}

function FallbackAuth() {
  const { t } = useLanguage();

  return (
    <>
      <Link href="/ideas/submit" className="btn-accent text-sm py-2 px-4 hidden sm:block">
        {t.nav.submitIdea}
      </Link>
      <Link
        href="/sign-in"
        className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
      >
        <LogIn className="w-4 h-4" />
        {t.nav.signIn}
      </Link>
    </>
  );
}

const navIcons = {
  "/projects": FolderKanban,
  "/challenges": Award,
  "/ideas": Lightbulb,
  "/leaderboard": Trophy,
  "/map": Map,
  "/manifesto": Heart,
};

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { t, locale } = useLanguage();

  // Fetch current user role for admin link visibility
  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.role) setUserRole(data.user.role);
      })
      .catch(() => {});
  }, []);

  const navLinks = [
    { href: "/projects", label: t.nav.projects, icon: FolderKanban },
    { href: "/challenges", label: t.nav.challenges, icon: Award },
    { href: "/ideas", label: t.nav.ideas, icon: Lightbulb },
    { href: "/leaderboard", label: t.nav.leaderboard, icon: Trophy },
    { href: "/arena", label: t.nav.arena, icon: FlaskConical },
    { href: "/impact-dashboard", label: locale === "fr" ? "Impact" : "Impact", icon: BarChart3 },
    { href: "/manifesto", label: t.nav.manifesto, icon: Heart },
    { href: "/map", label: t.nav.map, icon: Map },
    ...(userRole === "ADMIN"
      ? [{ href: "/admin", label: "Admin", icon: Shield }]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <FutureAILogo size={36} className="group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold gradient-text hidden sm:block">
              FutureAI
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth + CTA + Notifications + Language */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LanguageSwitcher />
            <AuthSection />

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white"
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
              className="md:hidden overflow-hidden border-t border-white/5"
            >
              <div className="py-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/ideas/submit"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 mt-2 text-accent-400 font-medium"
                >
                  <Lightbulb className="w-5 h-5" />
                  {t.nav.submitIdea}
                </Link>
                <div className="px-4 pt-2">
                  <LanguageSwitcher />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
