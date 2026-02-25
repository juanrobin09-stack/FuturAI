"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n";
import FutureAILogo from "@/components/FutureAILogo";

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
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="flex items-center gap-2 mb-8">
          <FutureAILogo size={32} />
          <span className="text-lg font-bold gradient-text">FutureAI</span>
        </div>
        <ClerkSignUp
          appearance={{
            elements: {
              rootBox: "w-full max-w-md",
              card: "bg-gray-900/90 border border-white/10 shadow-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton:
                "bg-gray-800 border-white/10 text-white hover:bg-gray-700",
              formFieldLabel: "text-gray-300",
              formFieldInput:
                "bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500",
              footerActionLink: "text-primary-400 hover:text-primary-300",
              formButtonPrimary:
                "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
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
