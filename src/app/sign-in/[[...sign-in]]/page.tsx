"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n";
import FutureAILogo from "@/components/FutureAILogo";
import { clerkDarkTheme } from "@/lib/clerk-theme";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isClerkAvailable =
  clerkKey.startsWith("pk_") && !clerkKey.includes("placeholder");

export default function SignInPage() {
  const { t } = useLanguage();
  const [ClerkSignIn, setClerkSignIn] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    if (isClerkAvailable) {
      import("@clerk/nextjs").then((mod) => {
        setClerkSignIn(() => mod.SignIn);
      });
    }
  }, []);

  if (isClerkAvailable && ClerkSignIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
        {/* Logo + branding */}
        <Link href="/" className="flex items-center gap-3 mb-2 group">
          <FutureAILogo size={44} className="group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold gradient-text">FutureAI</span>
        </Link>
        <p className="text-sm text-gray-500 mb-8">{t.auth.signInSubtitle || "Connecte-toi pour continuer"}</p>

        {/* Clerk form — centered */}
        <div className="w-full flex justify-center">
          <ClerkSignIn
            appearance={clerkDarkTheme}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="card max-w-md w-full text-center">
        <LogIn className="w-12 h-12 text-primary-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t.auth.signIn}</h1>
        <p className="text-gray-400 text-sm mb-6">
          {isClerkAvailable ? t.common.loading : t.auth.clerkNotConfigured}
        </p>
        <div className="space-y-3">
          <div className="p-3 bg-gray-800/50 rounded-lg text-left text-xs font-mono text-gray-400">
            <p>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...</p>
            <p>CLERK_SECRET_KEY=sk_test_...</p>
          </div>
          <p className="text-xs text-gray-500">
            {t.auth.getKeysAt}{" "}
            <a
              href="https://dashboard.clerk.com"
              target="_blank"
              rel="noopener"
              className="text-primary-400 hover:underline"
            >
              dashboard.clerk.com
            </a>
          </p>
        </div>
        <Link href="/" className="btn-primary mt-6 inline-block">
          {t.auth.backHome}
        </Link>
      </div>
    </div>
  );
}
