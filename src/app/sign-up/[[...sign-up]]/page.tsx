"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n";
import FutureAILogo from "@/components/FutureAILogo";
import { clerkDarkTheme } from "@/lib/clerk-theme";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isClerkAvailable =
  clerkKey.startsWith("pk_") && !clerkKey.includes("placeholder");

export default function SignUpPage() {
  const { t } = useLanguage();
  const [ClerkSignUp, setClerkSignUp] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    if (isClerkAvailable) {
      import("@clerk/nextjs").then((mod) => {
        setClerkSignUp(() => mod.SignUp);
      });
    }
  }, []);

  if (isClerkAvailable && ClerkSignUp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
        {/* Logo + branding */}
        <Link href="/" className="flex items-center gap-3 mb-2 group">
          <FutureAILogo size={44} className="group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold gradient-text">FutureAI</span>
        </Link>
        <p className="text-sm text-gray-500 mb-8">{t.auth.signUpSubtitle || "Rejoins la communauté"}</p>

        {/* Clerk form — centered */}
        <div className="w-full flex justify-center">
          <ClerkSignUp
            appearance={clerkDarkTheme}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="card max-w-md w-full text-center">
        <UserPlus className="w-12 h-12 text-accent-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t.auth.signUp}</h1>
        <p className="text-gray-400 text-sm mb-6">{t.auth.configureClerk}</p>
        <Link href="/" className="btn-primary inline-block">
          {t.auth.backHome}
        </Link>
      </div>
    </div>
  );
}
