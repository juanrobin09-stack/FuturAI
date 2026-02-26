"use client";

import { useEffect, useState } from "react";
import IdeaCard from "@/components/IdeaCard";
import CategoryFilter from "@/components/CategoryFilter";
import { Search, Loader2, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/i18n";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerList";
import PageTransition from "@/components/animations/PageTransition";

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string | null;
  country: string | null;
  createdAt: string;
  author: { username: string; avatarUrl: string | null };
  score: number;
}

export default function IdeasPage() {
  const { t } = useLanguage();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);

    fetch(`/api/ideas?${params}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Fetch failed");
        return r.json();
      })
      .then((data) => {
        setIdeas(data.ideas || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch ideas:", err);
        setLoading(false);
      });
  }, [category, search]);

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t.ideas.title} <span className="gradient-text">{t.ideas.titleHighlight}</span>
            </h1>
            <p className="text-gray-400 mt-1">
              {t.ideas.count.replace("{count}", String(ideas.length))}
            </p>
          </div>
          <Link href="/ideas/submit" className="btn-accent flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            {t.ideas.submit}
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.ideas.searchPlaceholder}
            className="input-field pl-11"
          />
        </div>

        {/* Category filter */}
        <div className="mb-8">
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>

        {/* Ideas list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : ideas.length > 0 ? (
          <StaggerContainer className="space-y-4">
            {ideas.map((idea) => (
              <StaggerItem key={idea.id}>
                <IdeaCard idea={idea} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="card text-center py-16">
            <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400">{t.ideas.noIdeasFound}</h3>
            <p className="text-sm text-gray-500 mt-2">
              {t.ideas.noIdeasHint}
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
