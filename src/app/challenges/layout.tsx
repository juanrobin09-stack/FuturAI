import type { Metadata } from "next";
import { getServerTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = getServerTranslations();
  return {
    title: t.seo.challengesTitle,
    description: t.seo.challengesDesc,
    openGraph: {
      title: t.seo.challengesTitle,
      description: t.seo.challengesDesc,
      url: "https://futurai.space/challenges",
    },
  };
}

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
