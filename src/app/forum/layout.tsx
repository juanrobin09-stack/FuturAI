import type { Metadata } from "next";
import { getServerTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = getServerTranslations();
  return {
    title: t.seo.forumTitle,
    description: t.seo.forumDesc,
    openGraph: {
      title: t.seo.forumTitle,
      description: t.seo.forumDesc,
      url: "https://futurai.space/forum",
    },
  };
}

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
