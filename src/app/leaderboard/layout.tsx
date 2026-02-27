import type { Metadata } from "next";
import { getServerTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = getServerTranslations();
  return {
    title: t.seo.leaderboardTitle,
    description: t.seo.leaderboardDesc,
    openGraph: {
      title: t.seo.leaderboardTitle,
      description: t.seo.leaderboardDesc,
      url: "https://futurai.space/leaderboard",
    },
  };
}

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
