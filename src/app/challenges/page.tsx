"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ChallengeCard from "@/components/ChallengeCard";
import { Trophy, Search, Plus } from "lucide-react";
import { SkeletonGrid } from "@/components/Skeleton";
import { useLanguage } from "@/i18n";
import { CHALLENGE_CATEGORIES } from "@/lib/utils";
import PageTransition from "@/components/animations/PageTransition";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerList";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string | null;
  type: string;
  status: string;
  prize: string | null;
  startDate: string;
  endDate: string;
  impactArea?: string | null;
  _count?: { entries: number };
}

export default function ChallengesPage() {
  const { t } = useLanguage();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const STATUS_FILTERS = [
    { value: "", label: t.challenges.statusAll },
    { value: "open", label: t.challenges.statusOpen },
    { value: "voting", label: t.challenges.statusVoting },
    { value: "closed", label: t.challenges.statusClosed },
  ];

  const fetchChallenges = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);

    fetch(`/api/challenges?${params}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Fetch failed");
        return r.json();
      })
      .then((data) => {
        setChallenges(data.challenges || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch challenges:", err);
        setLoading(false);
      });
  }, [status, search, categoryFilter]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-accent-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                <span className="gradient-text">{t.challenges.title}</span>
              </h1>
              <p className="text-gray-400 mt-0.5">
                {t.challenges.count.replace("{count}", String(challenges.length))}
              </p>
            </div>
          </div>
          <Link
            href="/challenges/create"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t.challengeDetail.createChallenge}
          </Link>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.challenges.searchPlaceholder}
            className="input-field pl-11"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.value}
              onClick={() => setStatus(sf.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                status === sf.value
                  ? "bg-accent-500/15 text-accent-400 border border-accent-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setCategoryFilter("")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              categoryFilter === ""
                ? "bg-primary-500/15 text-primary-400 border border-primary-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            {t.common.allF}
          </button>
          {CHALLENGE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                categoryFilter === cat.value
                  ? "bg-primary-500/15 text-primary-400 border border-primary-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              {t.challengeCategories[cat.value] || cat.value}
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonGrid count={4} type="card" />
        ) : challenges.length > 0 ? (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((challenge) => (
              <StaggerItem key={challenge.id}>
                <ChallengeCard challenge={challenge} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="card text-center py-16">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400">{t.challenges.noChallengesFound}</h3>
            <p className="text-sm text-gray-500 mt-2">{t.challenges.noChallengesHint}</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
