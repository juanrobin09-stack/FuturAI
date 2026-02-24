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

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const clerk = await import("@clerk/nextjs");
        // Now try to use the clerk module — useUser/useAuth can't be called outside a component,
        // so we rely on window.Clerk instance (already loaded by ClerkProvider)
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

        // Check immediately
        if (check()) return;

        // Poll until Clerk loads (max 10s)
        const interval = setInterval(() => {
          if (check()) clearInterval(interval);
        }, 150);

        setTimeout(() => {
          clearInterval(interval);
          if (!cancelled) {
            // Clerk didn't load in time — show sign-in links
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

  // Also listen for auth state changes (sign-in / sign-out)
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

    // Re-check auth when window regains focus (after redirect from Clerk)
    window.addEventListener("focus", handleFocus);

    // Also re-check periodically for the first 15 seconds after mount
    // This catches the case where user just completed sign-up and was redirected
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
      if (checks > 30) clearInterval(interval); // Stop after 15s
    }, 500);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

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

  // Signed in — show profile + user button
  if (authState.signed && authState.UserButton) {
    const UB = authState.UserButton;
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
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
        >
          {t.nav.profile || "Profil"}
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
