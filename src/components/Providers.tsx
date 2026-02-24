"use client";

import AuthProvider from "./AuthProvider";
import { LanguageProvider } from "@/i18n";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </AuthProvider>
  );
}
