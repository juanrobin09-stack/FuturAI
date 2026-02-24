import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConsentBanner from "@/components/ConsentBanner";
import Providers from "@/components/Providers";
import { fr } from "@/i18n/translations/fr";
import { en } from "@/i18n/translations/en";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#030712",
};

export async function generateMetadata(): Promise<Metadata> {
  let locale = "en";
  try {
    const cookieStore = cookies();
    locale = cookieStore.get("locale")?.value === "fr" ? "fr" : "en";
  } catch {}
  const t = locale === "en" ? en : fr;

  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      languages: { fr: "/", en: "/" },
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <html lang="en" suppressHydrationWarning className={`dark ${inter.variable}`}>
        <body className={`${inter.className} min-h-screen flex flex-col`}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ConsentBanner />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1f2937",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
              },
            }}
          />
        </body>
      </html>
    </Providers>
  );
}
