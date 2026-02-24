"use client";

import { useEffect, useState, type ReactNode } from "react";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

const isClerkConfigured =
  publishableKey.startsWith("pk_") &&
  !publishableKey.includes("placeholder");

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    if (isClerkConfigured) {
      import("@clerk/nextjs").then((mod) => {
        setProvider(() => mod.ClerkProvider);
      });
    }
  }, []);

  // If Clerk isn't configured or hasn't loaded yet, render without auth
  if (!isClerkConfigured || !Provider) {
    return <>{children}</>;
  }

  return (
    <Provider
      publishableKey={publishableKey}
      appearance={{
        variables: {
          colorPrimary: "#0d9488",
          colorText: "#ffffff",
          colorBackground: "#111827",
          colorInputBackground: "#1f2937",
          colorInputText: "#ffffff",
        },
      }}
    >
      {children}
    </Provider>
  );
}
