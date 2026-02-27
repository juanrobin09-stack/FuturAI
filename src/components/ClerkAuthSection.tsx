"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { useLanguage } from "@/i18n";

/**
 * Client-only auth section (loaded via dynamic import with ssr:false).
 * Detects auth state via Clerk + /api/users/me and re-checks on navigation.
 */
export default function ClerkAuthSection() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const [clerkReady, setClerkReady] = useState(false);
  const [ClerkUserButton, setClerkUserButton] = useState<React.ComponentType<any> | null>(null);

  // API-based auth check (reliable, server-side)
  const [apiUser, setApiUser] = useState<{ username: string; avatarUrl: string | null } | null>(null);
  const [apiChecked, setApiChecked] = useState(false);

  // Check auth via API
  const checkAuth = useCallback(async () => {
    try {
      // First quick check: if Clerk says user is signed out, trust it immediately
      const inst = (window as any).Clerk;
      if (inst?.loaded && !inst?.user) {
        setApiUser(null);
        setApiChecked(true);
        return;
      }

      const res = await fetch("/api/users/me");
      const data = await res.json();
      if (data?.user?.username) {
        setApiUser({
          username: data.user.username,
          avatarUrl: data.user.avatarUrl || null,
        });
      } else {
        setApiUser(null);
      }
    } catch {
      setApiUser(null);
    } finally {
      setApiChecked(true);
    }
  }, []);

  // 1) Check auth on mount and on every route change
  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

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
          // If Clerk is loaded but user is null → signed out
          if (inst?.loaded && !inst?.user) {
            if (!cancelled) {
              setClerkReady(false);
              setClerkUserButton(null);
              setApiUser(null);
              setApiChecked(true);
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

  // 3) Watch for Clerk sign-out (poll every 2s — lightweight check)
  useEffect(() => {
    const interval = setInterval(() => {
      const inst = (window as any).Clerk;
      if (inst?.loaded && !inst?.user && apiUser) {
        // Clerk says user is signed out but we still show profile → clear
        setApiUser(null);
        setClerkReady(false);
        setClerkUserButton(null);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [apiUser]);

  // 4) Re-check on window focus (user may have signed out in another tab)
  useEffect(() => {
    const handleFocus = () => {
      const inst = (window as any).Clerk;
      if (inst?.loaded && !inst?.user) {
        setApiUser(null);
        setClerkReady(false);
        setClerkUserButton(null);
      } else {
        checkAuth();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [checkAuth]);

  // Determine auth state: API is the reliable source
  const isSignedIn = !!apiUser;
  const isLoading = !apiChecked;

  // Loading — show sign-in placeholders briefly
  if (isLoading) {
    return (
      <>
        {/* Desktop */}
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-gray-500 border border-white/5">
          <LogIn className="w-3.5 h-3.5" />
          ...
        </span>
        {/* Mobile */}
        <span className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 border border-white/5">
          <LogIn className="w-4 h-4" />
        </span>
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
          {apiUser.avatarUrl ? (
            <img
              src={apiUser.avatarUrl}
              alt={apiUser.username}
              className="w-7 h-7 rounded-md object-cover shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div className={`w-7 h-7 rounded-md bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold shrink-0 ${apiUser.avatarUrl ? "hidden" : ""}`}>
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
      {/* Desktop: full buttons */}
      <Link
        href="/sign-in"
        className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
      >
        <LogIn className="w-3.5 h-3.5" />
        {t.nav.signIn}
      </Link>
      <Link
        href="/sign-up"
        className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-400 hover:to-primary-500 transition-all shadow-sm"
      >
        <UserPlus className="w-3.5 h-3.5" />
        {t.nav.signUp}
      </Link>
      {/* Mobile: icon-only */}
      <Link
        href="/sign-in"
        className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
      >
        <LogIn className="w-4 h-4" />
      </Link>
    </>
  );
}
