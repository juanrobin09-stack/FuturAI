import type { Metadata } from "next";
import { getServerTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = getServerTranslations();
  return {
    title: t.seo.arenaTitle,
    description: t.seo.arenaDesc,
    openGraph: {
      title: t.seo.arenaTitle,
      description: t.seo.arenaDesc,
      url: "https://futurai.space/arena",
    },
  };
}

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
