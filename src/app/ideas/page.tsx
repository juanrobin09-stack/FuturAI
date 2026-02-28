"use client";

import { useEffect, useState, useMemo } from "react";
import IdeaCard from "@/components/IdeaCard";
import CategoryFilter from "@/components/CategoryFilter";
import { Search, Lightbulb, Globe } from "lucide-react";
import { SkeletonGrid } from "@/components/Skeleton";
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
  status?: string;
  createdAt: string;
  author: { username: string; avatarUrl: string | null };
  score: number;
  userVote?: number;
  commentCount?: number;
  collaboratorCount?: number;
}

const REGIONS: Record<string, string[]> = {
  Afrique: ["afrique", "nigeria", "nigéria", "rwanda", "kenya", "senegal", "sénégal", "ghana", "congo", "cameroun", "mali", "niger", "cote d'ivoire", "côte d'ivoire", "ethiopie", "éthiopie", "tanzanie", "mozambique", "guinee", "guinée", "egypte", "égypte"],
  Europe: ["europe", "france", "allemagne", "royaume-uni", "espagne", "italie", "portugal", "belgique", "suisse", "pays-bas", "autriche", "pologne", "suede", "suède", "geneve", "genève", "grece", "grèce"],
  Asie: ["asie", "inde", "bangladesh", "japon", "chine", "indonesie", "indonésie", "vietnam", "thailande", "thaïlande", "pakistan", "philippines", "coree", "corée", "nepal", "népal", "sri lanka", "myanmar", "malaisie"],
  "Amériques": ["amerique", "amérique", "bresil", "brésil", "colombie", "amazonie", "mexique", "canada", "argentine", "perou", "pérou", "chili", "bolivie", "equateur", "équateur", "venezuela", "usa", "etats-unis", "états-unis"],
  "Moyen-Orient": ["moyen-orient", "liban", "jordanie", "syrie", "irak", "iran", "turquie", "palestine", "israel", "arabie", "emirats", "yemen"],
};

export default function IdeasPage() {
  const { t } = useLanguage();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");

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

  const filteredIdeas = useMemo(() => {
    if (!region) return ideas;
    const keywords = REGIONS[region];
    if (!keywords) return ideas;
    return ideas.filter((idea) => {
      if (!idea.country) return false;
      const c = idea.country.toLowerCase();
      return keywords.some((kw) => c.includes(kw));
    });
  }, [ideas, region]);

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t.ideas.title} <span className="gradient-text">{t.ideas.titleHighlight}</span>
            </h1>
            <p className="text-gray-400 mt-1">
              {t.ideas.count.replace("{count}", String(filteredIdeas.length))}
            </p>
          </div>
          <Link href="/ideas/submit" className="btn-accent flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            {t.ideas.submit}
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.ideas.searchPlaceholder}
            className="input-field pl-11"
          />
        </div>

        {/* Category filter */}
        <div className="mb-4">
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>

        {/* Region filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <Globe className="w-4 h-4 text-gray-500 shrink-0" />
            <button
              onClick={() => setRegion("")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !region
                  ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                  : "text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10 border border-transparent"
              }`}
            >
              Tous
            </button>
            {Object.keys(REGIONS).map((r) => (
              <button
                key={r}
                onClick={() => setRegion(region === r ? "" : r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  region === r
                    ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                    : "text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10 border border-transparent"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Ideas list */}
        {loading ? (
          <SkeletonGrid count={4} type="list" />
        ) : filteredIdeas.length > 0 ? (
          <StaggerContainer className="space-y-4">
            {filteredIdeas.map((idea) => (
              <StaggerItem key={idea.id}>
                <IdeaCard idea={idea} userVote={idea.userVote} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="card text-center py-16">
            <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400">{t.ideas.noIdeasFound}</h3>
            <p className="text-sm text-gray-500 mt-2">
              {region
                ? `Aucune idée trouvée pour la région "${region}". Essayez un autre filtre.`
                : t.ideas.noIdeasHint}
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
