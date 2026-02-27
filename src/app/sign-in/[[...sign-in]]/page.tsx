"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n";
import FutureAILogo from "@/components/FutureAILogo";

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

        {/* Clerk form */}
        <div className="w-full max-w-[440px]">
          <ClerkSignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "!bg-gray-900/80 !backdrop-blur-xl !border !border-white/10 !shadow-2xl !shadow-black/40 !rounded-2xl",
                headerTitle: "!text-white !text-xl",
                headerSubtitle: "!text-gray-400",
                socialButtonsBlockButton:
                  "!bg-gray-800/80 !border-white/10 !text-white hover:!bg-gray-700 !rounded-xl !transition-all",
                socialButtonsBlockButtonText: "!text-sm !font-medium",
                dividerLine: "!bg-white/10",
                dividerText: "!text-gray-500",
                formFieldLabel: "!text-gray-300 !text-sm",
                formFieldInput:
                  "!bg-gray-800/60 !border-white/10 !text-white !placeholder-gray-500 !rounded-xl focus:!border-primary-500/50 focus:!ring-primary-500/20",
                footerAction: "!text-gray-400",
                footerActionLink: "!text-primary-400 hover:!text-primary-300 !font-medium",
                formButtonPrimary:
                  "!bg-gradient-to-r !from-primary-500 !to-primary-600 hover:!from-primary-400 hover:!to-primary-500 !rounded-xl !text-sm !font-semibold !shadow-lg !shadow-primary-500/20 !transition-all",
                identityPreview: "!bg-gray-800/60 !border-white/10",
                identityPreviewText: "!text-gray-300",
                identityPreviewEditButton: "!text-primary-400",
                formFieldAction: "!text-primary-400",
                alertText: "!text-red-300",
                formFieldErrorText: "!text-red-400",
              },
            }}
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
