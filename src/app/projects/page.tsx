"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import CategoryFilter from "@/components/CategoryFilter";
import { Search, Loader2, FolderKanban, Plus, FlaskConical, ArrowRight } from "lucide-react";
import { PROJECT_STATUSES, getStatusLabel } from "@/lib/utils";
import { useLanguage } from "@/i18n";
import PageTransition from "@/components/animations/PageTransition";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerList";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  imageUrl: string | null;
  country: string | null;
  createdAt: string;
  _count?: {
    members?: number;
    comments?: number;
    contributions?: number;
  };
  members?: Array<{
    user: { username: string; avatarUrl?: string | null };
    role: string;
  }>;
}

export default function ProjectsPage() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const fetchProjects = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (search) params.set("search", search);

    fetch(`/api/projects?${params}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Fetch failed");
        return r.json();
      })
      .then((data) => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch projects:", err);
        setLoading(false);
      });
  }, [category, status, search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const statusFilters = [
    { value: "", label: t.common.all },
    ...PROJECT_STATUSES.filter((s) => s.value !== "archived").map((s) => ({
      value: s.value,
      label: getStatusLabel(s.value, t.statuses),
    })),
  ];

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              {t.projects.title} <span className="gradient-text">{t.projects.titleHighlight}</span>
            </h1>
            <p className="text-gray-400 mt-1">
              {t.projects.count.replace("{count}", String(projects.length))}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/arena" className="btn-ghost flex items-center gap-2 text-accent-400 border border-accent-500/20 hover:bg-accent-500/10">
              <FlaskConical className="w-4 h-4" />
              Arena IA
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link href="/projects/create" className="btn-accent flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t.projects.createProject}
            </Link>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.projects.searchPlaceholder}
            className="input-field pl-11"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {statusFilters.map((sf) => (
            <button
              key={sf.value}
              onClick={() => setStatus(sf.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                status === sf.value
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        <div className="mb-8">
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : projects.length > 0 ? (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <StaggerItem key={project.id}>
                <ProjectCard project={project} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="card text-center py-16">
            <FolderKanban className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400">{t.projects.noProjectsFound}</h3>
            <p className="text-sm text-gray-500 mt-2">{t.projects.noProjectsHint}</p>
            <Link href="/projects/create" className="btn-primary inline-flex items-center gap-2 mt-4">
              <Plus className="w-4 h-4" />
              {t.projects.createProject}
            </Link>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
