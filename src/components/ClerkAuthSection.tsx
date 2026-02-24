"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { useLanguage } from "@/i18n";

/**
 * Client-only auth section (loaded via dynamic import with ssr:false).
 * Uses Clerk hooks safely — never runs during SSR / static generation.
 */
export default function ClerkAuthSection() {
  const { t } = useLanguage();
  const [authState, setAuthState] = useState<{
    loaded: boolean;
    signed: boolean;
    UserButton: React.ComponentType<any> | null;
  }>({ loaded: false, signed: false, UserButton: null });

  // User avatar & username for navbar display
  const [userInfo, setUserInfo] = useState<{ avatarUrl: string | null; username: string }>({
    avatarUrl: null,
    username: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const clerk = await import("@clerk/nextjs");
        const check = () => {
          const clerkInstance = (window as any).Clerk;
          if (!clerkInstance) return false;
          if (clerkInstance.loaded) {
            if (!cancelled) {
              setAuthState({
                loaded: true,
                signed: !!clerkInstance.user,
                UserButton: clerkInstance.user ? clerk.UserButton : null,
              });
            }
            return true;
          }
          return false;
        };

        if (check()) return;

        const interval = setInterval(() => {
          if (check()) clearInterval(interval);
        }, 150);

        setTimeout(() => {
          clearInterval(interval);
          if (!cancelled) {
            setAuthState({ loaded: true, signed: false, UserButton: null });
          }
        }, 10000);
      } catch {
        if (!cancelled) {
          setAuthState({ loaded: true, signed: false, UserButton: null });
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Re-check auth on focus / periodic check
  useEffect(() => {
    const handleFocus = async () => {
      const clerkInstance = (window as any).Clerk;
      if (clerkInstance?.loaded) {
        try {
          const clerk = await import("@clerk/nextjs");
          setAuthState({
            loaded: true,
            signed: !!clerkInstance.user,
            UserButton: clerkInstance.user ? clerk.UserButton : null,
          });
        } catch {}
      }
    };

    window.addEventListener("focus", handleFocus);

    let checks = 0;
    const interval = setInterval(async () => {
      checks++;
      const clerkInstance = (window as any).Clerk;
      if (clerkInstance?.loaded && clerkInstance?.user) {
        try {
          const clerk = await import("@clerk/nextjs");
          setAuthState({
            loaded: true,
            signed: true,
            UserButton: clerk.UserButton,
          });
          clearInterval(interval);
        } catch {}
      }
      if (checks > 30) clearInterval(interval);
    }, 500);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Fetch user info for avatar display when signed in
  useEffect(() => {
    if (!authState.signed) return;

    async function fetchUserInfo() {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();
        if (data?.user) {
          setUserInfo({
            avatarUrl: data.user.avatarUrl || null,
            username: data.user.username || "",
          });
        }
      } catch {
        // ignore
      }
    }

    fetchUserInfo();
  }, [authState.signed]);

  // Not loaded yet — show sign-in links as placeholder
  if (!authState.loaded) {
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

  // Signed in — show avatar link + submit idea + user button
  if (authState.signed && authState.UserButton) {
    const UB = authState.UserButton;
    const initial = userInfo.username ? userInfo.username.charAt(0).toUpperCase() : "?";
    return (
      <>
        <Link
          href="/ideas/submit"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-400 hover:to-accent-500 transition-all"
        >
          {t.nav.submitIdea}
        </Link>
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
        <UB
          afterSignOutUrl="/"
          appearance={{ elements: { avatarBox: "w-8 h-8 rounded-lg" } }}
        />
      </>
    );
  }

  // Not signed in — show sign-in / sign-up
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
