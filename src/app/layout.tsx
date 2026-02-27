import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConsentBanner from "@/components/ConsentBanner";
import WelcomeModal from "@/components/WelcomeModal";
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
    title: {
      default: t.meta.title,
      template: "%s | FutureAI",
    },
    description: t.meta.description,
    metadataBase: new URL("https://futurai.space"),
    alternates: {
      languages: { fr: "/", en: "/" },
    },
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      url: "https://futurai.space",
      siteName: "FutureAI",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.title,
      description: t.meta.description,
    },
    icons: {
      icon: "/favicon.svg",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.json",
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
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
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "FutureAI",
                url: "https://futurai.space",
                description: "Global AI Collaboration Platform",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://futurai.space/ideas?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              }),
            }}
          />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ConsentBanner />
          <WelcomeModal />
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
