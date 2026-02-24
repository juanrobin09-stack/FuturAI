"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { type ReactNode } from "react";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

export const isClerkConfigured =
  publishableKey.startsWith("pk_") &&
  !publishableKey.includes("placeholder");

export default function AuthProvider({ children }: { children: ReactNode }) {
  if (!isClerkConfigured) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
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
    </ClerkProvider>
  );
}
