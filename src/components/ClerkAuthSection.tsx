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
      // BUT use a very long grace period — Clerk token refresh can briefly show null
      const inst = (window as any).Clerk;
      if (inst?.loaded && inst?.user === null) {
        const timeSinceSuccess = Date.now() - lastSuccessRef.current;
        // Only clear if no success in the last 5 minutes (token refresh can be slow)
        if (timeSinceSuccess > 300000 || !apiUser) {
          setApiUser(null);
          setApiChecked(true);
          failCountRef.current = 0;
          checkInProgressRef.current = false;
          return;
        }
        // Otherwise, don't trust the null — try the API instead
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

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
          if (failCountRef.current >= 3) {
            setApiUser(null);
          }
        }
      } else if (res.status === 401 || res.status === 403) {
        // Definitive auth failure → clear after 3 consecutive failures
        failCountRef.current++;
        if (failCountRef.current >= 3) {
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
    // Only re-check on navigation if it's been a long while since last success
    if (timeSinceSuccess > 60000) {
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

  // 4) Watch for Clerk sign-out (poll every 60s — very relaxed)
  useEffect(() => {
    const interval = setInterval(() => {
      const inst = (window as any).Clerk;
      if (inst?.loaded && inst?.user === null && apiUser) {
        // Clerk says no user — but only act if no recent success (protects token refresh)
        const timeSinceSuccess = Date.now() - lastSuccessRef.current;
        if (timeSinceSuccess > 300000) {
          // No success in 5 min + Clerk null → truly signed out
          failCountRef.current++;
          if (failCountRef.current >= 3) {
            setApiUser(null);
            setClerkReady(false);
            setClerkUserButton(null);
            failCountRef.current = 0;
          }
        }
      } else if (inst?.loaded && inst?.user && !apiUser && apiChecked) {
        // Clerk says user IS signed in but we don't show it → re-check API
        checkAuth();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [apiUser, apiChecked, checkAuth]);

  // 5) Re-check on window focus (user may have signed out in another tab)
  useEffect(() => {
    const handleFocus = () => {
      // Only re-check if it's been a long while since last success
      const timeSinceSuccess = Date.now() - lastSuccessRef.current;
      if (timeSinceSuccess > 120000) {
        checkAuth();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [checkAuth]);

  // 6) Listen for Clerk session changes via event
  // IMPORTANT: Clerk fires user=null during token refresh — do NOT immediately clear
  useEffect(() => {
    const inst = (window as any).Clerk;
    if (inst?.addListener) {
      let signOutTimer: ReturnType<typeof setTimeout> | null = null;
      const unsubscribe = inst.addListener(({ user }: any) => {
        if (user) {
          // User signed in or token refreshed → refresh state, cancel any pending sign-out
          if (signOutTimer) { clearTimeout(signOutTimer); signOutTimer = null; }
          checkAuth();
          failCountRef.current = 0;
        } else if (user === null) {
          // Clerk says null — could be token refresh or real sign-out
          // Wait 30s to confirm it's a real sign-out (token refresh resolves in <10s)
          if (signOutTimer) clearTimeout(signOutTimer);
          signOutTimer = setTimeout(() => {
            const currentInst = (window as any).Clerk;
            if (currentInst?.loaded && currentInst?.user === null) {
              // Still null after 30s → real sign-out
              setApiUser(null);
              setClerkReady(false);
              setClerkUserButton(null);
              failCountRef.current = 0;
            }
            signOutTimer = null;
          }, 30000);
        }
      });
      return () => {
        if (signOutTimer) clearTimeout(signOutTimer);
        if (typeof unsubscribe === "function") unsubscribe();
      };
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
