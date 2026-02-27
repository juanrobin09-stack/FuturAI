"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { useLanguage } from "@/i18n";

/**
 * Client-only auth section (loaded via dynamic import with ssr:false).
 * Checks both window.Clerk AND /api/users/me to detect auth state.
 */
export default function ClerkAuthSection() {
  const { t } = useLanguage();

  const [clerkReady, setClerkReady] = useState(false);
  const [ClerkUserButton, setClerkUserButton] = useState<React.ComponentType<any> | null>(null);

  // API-based auth check (reliable, server-side)
  const [apiUser, setApiUser] = useState<{ username: string; avatarUrl: string | null } | null>(null);
  const [apiChecked, setApiChecked] = useState(false);

  // 1) Check /api/users/me immediately — this is the reliable auth source
  useEffect(() => {
    async function checkApi() {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();
        if (data?.user?.username) {
          setApiUser({
            username: data.user.username,
            avatarUrl: data.user.avatarUrl || null,
          });
        }
      } catch {
        // not signed in
      } finally {
        setApiChecked(true);
      }
    }
    checkApi();
  }, []);

  // 2) Try to load Clerk UserButton (for the dropdown menu)
  useEffect(() => {
    let cancelled = false;

    async function initClerk() {
      try {
        const clerk = await import("@clerk/nextjs");

        const check = () => {
          const inst = (window as any).Clerk;
          if (inst?.loaded && inst?.user) {
            if (!cancelled) {
              setClerkReady(true);
              setClerkUserButton(() => clerk.UserButton);
            }
            return true;
          }
          return false;
        };

        if (check()) return;

        // Poll for up to 15 seconds
        let tries = 0;
        const interval = setInterval(() => {
          tries++;
          if (check() || tries > 100) clearInterval(interval);
        }, 150);

        return () => clearInterval(interval);
      } catch {
        // Clerk not available
      }
    }

    initClerk();
    return () => { cancelled = true; };
  }, []);

  // Re-check Clerk on window focus
  useEffect(() => {
    const handleFocus = async () => {
      const inst = (window as any).Clerk;
      if (inst?.loaded && inst?.user) {
        try {
          const clerk = await import("@clerk/nextjs");
          setClerkReady(true);
          setClerkUserButton(() => clerk.UserButton);
        } catch {}
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Determine auth state: API is the reliable source
  const isSignedIn = !!apiUser;
  const isLoading = !apiChecked;

  // Loading — show sign-in placeholders briefly
  if (isLoading) {
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

  // Signed in — show profile link (+ Clerk UserButton if available)
  if (isSignedIn) {
    const initial = apiUser.username.charAt(0).toUpperCase();
    return (
      <>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 border border-white/10 transition-all"
          title={t.nav.profile || "Profil"}
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initial}
          </div>
          <span className="hidden sm:inline text-xs font-medium text-gray-300">
            {t.nav.profile || "Profil"}
          </span>
        </Link>
        {clerkReady && ClerkUserButton && (
          <ClerkUserButton
            afterSignOutUrl="/"
            appearance={{ elements: { avatarBox: "w-8 h-8 rounded-lg" } }}
          />
        )}
      </>
    );
  }

  // Not signed in
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
