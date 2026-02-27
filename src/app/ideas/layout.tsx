import type { Metadata } from "next";
import { getServerTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = getServerTranslations();
  return {
    title: t.seo.ideasTitle,
    description: t.seo.ideasDesc,
    openGraph: {
      title: t.seo.ideasTitle,
      description: t.seo.ideasDesc,
      url: "https://futurai.space/ideas",
    },
  };
}

export default function IdeasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
