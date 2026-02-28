"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { useLanguage } from "@/i18n";
import { clerkDarkTheme } from "@/lib/clerk-theme";

/**
 * Client-only auth section (loaded via dynamic import with ssr:false).
 * Robust auth detection: never drops session on transient errors.
 */
export default function ClerkAuthSection() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const [clerkReady, setClerkReady] = useState(false);
  const [ClerkUserButton, setClerkUserButton] = useState<React.ComponentType<any> | null>(null);

  // API-based auth check (reliable, server-side)
  const [apiUser, setApiUser] = useState<{ username: string; avatarUrl: string | null } | null>(null);
  const [apiChecked, setApiChecked] = useState(false);

  // Track consecutive failures to prevent false logouts
  const failCountRef = useRef(0);
  const lastSuccessRef = useRef<number>(Date.now());
  const checkInProgressRef = useRef(false);

  // Check auth via API — NEVER clears state on network errors
  const checkAuth = useCallback(async () => {
    // Prevent concurrent checks
    if (checkInProgressRef.current) return;
    checkInProgressRef.current = true;

    try {
      // Quick check: if Clerk is fully loaded and says no user, trust it
      const inst = (window as any).Clerk;
      if (inst?.loaded && inst?.user === null) {
        // Clerk is definitively loaded and user is null → truly signed out
        // But only clear if we haven't had a success in the last 10s
        // (prevents false clear during token refresh)
        const timeSinceSuccess = Date.now() - lastSuccessRef.current;
        if (timeSinceSuccess > 10000 || !apiUser) {
          setApiUser(null);
          setApiChecked(true);
          failCountRef.current = 0;
          checkInProgressRef.current = false;
          return;
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch("/api/users/me", {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data?.user?.username) {
          setApiUser({
            username: data.user.username,
            avatarUrl: data.user.avatarUrl || null,
          });
          lastSuccessRef.current = Date.now();
          failCountRef.current = 0;
        } else {
          // API returned OK but no user → definitively not signed in
          failCountRef.current++;
          if (failCountRef.current >= 2) {
            setApiUser(null);
          }
        }
      } else if (res.status === 401 || res.status === 403) {
        // Definitive auth failure → clear after 2 consecutive failures
        failCountRef.current++;
        if (failCountRef.current >= 2) {
          setApiUser(null);
        }
      } else {
        // Server error (500, 503, etc.) — DON'T clear auth state
        // This is likely transient (deploy, cold start, etc.)
        failCountRef.current++;
      }
    } catch {
      // Network error, timeout, abort — DON'T clear auth state
      // User is probably still signed in, just a transient issue
      failCountRef.current++;
    } finally {
      setApiChecked(true);
      checkInProgressRef.current = false;
    }
  }, [apiUser]);

  // 1) Check auth on mount
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Re-check on route change (debounced — skip if checked recently)
  useEffect(() => {
    const timeSinceSuccess = Date.now() - lastSuccessRef.current;
    // Only re-check on navigation if it's been a while since last success
    if (timeSinceSuccess > 5000) {
      checkAuth();
    }
  }, [pathname, checkAuth]);

  // 3) Try to load Clerk UserButton (for the dropdown menu)
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
          if (inst?.loaded && inst?.user === null) {
            if (!cancelled) {
              setClerkReady(false);
              setClerkUserButton(null);
            }
            return true;
          }
          return false;
        };

        if (check()) return;

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

  // 4) Watch for Clerk sign-out (poll every 8s — relaxed, not aggressive)
  useEffect(() => {
    const interval = setInterval(() => {
      const inst = (window as any).Clerk;
      if (inst?.loaded && inst?.user === null && apiUser) {
        // Clerk definitively says no user — but require 2+ consecutive checks
        failCountRef.current++;
        if (failCountRef.current >= 2) {
          setApiUser(null);
          setClerkReady(false);
          setClerkUserButton(null);
          failCountRef.current = 0;
        }
      } else if (inst?.loaded && inst?.user && !apiUser && apiChecked) {
        // Clerk says user IS signed in but we don't show it → re-check API
        checkAuth();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [apiUser, apiChecked, checkAuth]);

  // 5) Re-check on window focus (user may have signed out in another tab)
  useEffect(() => {
    const handleFocus = () => {
      // Only re-check if it's been a while since last success
      const timeSinceSuccess = Date.now() - lastSuccessRef.current;
      if (timeSinceSuccess > 10000) {
        checkAuth();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [checkAuth]);

  // 6) Listen for Clerk session changes via event
  useEffect(() => {
    const inst = (window as any).Clerk;
    if (inst?.addListener) {
      const unsubscribe = inst.addListener(({ user }: any) => {
        if (user) {
          // User just signed in → refresh
          checkAuth();
          failCountRef.current = 0;
        } else if (user === null) {
          // User explicitly signed out via Clerk UI
          setApiUser(null);
          setClerkReady(false);
          setClerkUserButton(null);
          failCountRef.current = 0;
        }
      });
      return () => { if (typeof unsubscribe === "function") unsubscribe(); };
    }
  }, [checkAuth]);

  // Determine auth state
  const isSignedIn = !!apiUser;
  const isLoading = !apiChecked;

  if (isLoading) {
    return (
      <>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-gray-500 border border-white/5">
          <LogIn className="w-3.5 h-3.5" />
          ...
        </span>
        <span className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 border border-white/5">
          <LogIn className="w-4 h-4" />
        </span>
      </>
    );
  }

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
            appearance={{
              variables: clerkDarkTheme.variables,
              elements: {
                ...clerkDarkTheme.elements,
                avatarBox: "w-8 h-8 rounded-lg",
              },
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
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
      <Link
        href="/sign-in"
        className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
      >
        <LogIn className="w-4 h-4" />
      </Link>
    </>
  );
}
