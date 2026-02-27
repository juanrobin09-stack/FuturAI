import type { Metadata } from "next";
import { getServerTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = getServerTranslations();
  return {
    title: t.seo.projectsTitle,
    description: t.seo.projectsDesc,
    openGraph: {
      title: t.seo.projectsTitle,
      description: t.seo.projectsDesc,
      url: "https://futurai.space/projects",
    },
  };
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
