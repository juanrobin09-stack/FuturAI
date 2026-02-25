"use client";

import { useState, useEffect } from "react";
import { BarChart3, Globe, Users, TrendingUp, Target, Loader2, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n";
import { computeImpactIndex, IMPACT_TIERS, IRL_LABELS } from "@/lib/impact";

interface ProjectWithImpact {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  country?: string | null;
  problemSeverity?: number | null;
  populationAffected?: string | null;
  geographicScope?: string | null;
  implementationReadiness?: number | null;
  scalabilityPotential?: number | null;
  verificationMethod?: string | null;
  _count: { members: number; contributions: number };
}

export default function ImpactDashboardPage() {
  const { t, locale } = useLanguage();
  const [projects, setProjects] = useState<ProjectWithImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterScope, setFilterScope] = useState("");
  const [filterTier, setFilterTier] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Compute impact for all projects
  const projectsWithImpact = projects.map((p) => ({
    ...p,
    impact: computeImpactIndex(p),
  }));

  // Filter
  const filtered = projectsWithImpact.filter((p) => {
    if (filterScope && p.geographicScope !== filterScope) return false;
    if (filterTier && p.impact.tier !== filterTier) return false;
    return true;
  });

  // Aggregate stats
  const totalProjects = projects.length;
  const countriesSet = new Set(projects.map((p) => p.country).filter(Boolean));
  const totalContributors = projects.reduce((s, p) => s + (p._count?.members || 0), 0);
  const avgImpact = projectsWithImpact.length > 0
    ? Math.round(projectsWithImpact.reduce((s, p) => s + p.impact.impactIndex, 0) / projectsWithImpact.length)
    : 0;

  const scopes = ["local", "regional", "national", "continental", "global"];
  const tiers = ["exploratory", "promising", "high-impact", "transformative"] as const;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary-400" />
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
            {locale === "fr" ? "Tableau de Bord Impact" : "Impact Dashboard"}
          </h1>
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto">
          {locale === "fr"
            ? "Mesure transparente de l\u2019impact des projets sur les d\u00e9fis mondiaux"
            : "Transparent measurement of project impact on global challenges"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Target, value: totalProjects, label: locale === "fr" ? "Projets" : "Projects", color: "text-primary-400" },
          { icon: Globe, value: countriesSet.size, label: locale === "fr" ? "Pays" : "Countries", color: "text-accent-400" },
          { icon: Users, value: totalContributors, label: locale === "fr" ? "Contributeurs" : "Contributors", color: "text-blue-400" },
          { icon: TrendingUp, value: avgImpact, label: locale === "fr" ? "Impact moyen" : "Avg Impact", color: "text-green-400" },
        ].map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card text-center">
            <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filterScope}
          onChange={(e) => setFilterScope(e.target.value)}
          className="input-field w-auto text-sm"
        >
          <option value="">{locale === "fr" ? "Toutes les port\u00e9es" : "All scopes"}</option>
          {scopes.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="input-field w-auto text-sm"
        >
          <option value="">{locale === "fr" ? "Tous les niveaux" : "All tiers"}</option>
          {tiers.map((tier) => (
            <option key={tier} value={tier}>{IMPACT_TIERS[tier].label}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          {filtered.length} {locale === "fr" ? "projets" : "projects"}
        </span>
      </div>

      {/* Project Impact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((project, i) => {
          const tierConf = IMPACT_TIERS[project.impact.tier];
          return (
            <motion.a
              key={project.id}
              href={`/projects/${project.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card hover:border-primary-500/20 transition-all block`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-sm leading-tight line-clamp-2">{project.title}</h3>
                <span className={`text-lg font-bold ${tierConf.color} shrink-0 ml-2`}>
                  {project.impact.impactIndex}
                </span>
              </div>

              {/* Impact bar */}
              <div className="w-full h-2 bg-gray-800 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                  style={{ width: `${project.impact.impactIndex}%` }}
                />
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>{locale === "fr" ? "S\u00e9v\u00e9rit\u00e9" : "Severity"}</span>
                  <span className="text-white">{project.impact.breakdown.severityScore}/25</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>{locale === "fr" ? "Port\u00e9e" : "Reach"}</span>
                  <span className="text-white">{project.impact.breakdown.reachScore}/25</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>IRL</span>
                  <span className="text-white">{project.impact.breakdown.readinessScore}/25</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>{locale === "fr" ? "Scalabilit\u00e9" : "Scalability"}</span>
                  <span className="text-white">{project.impact.breakdown.scalabilityScore}/25</span>
                </div>
              </div>

              {/* Tier badge */}
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full ${tierConf.bg} ${tierConf.color} ${tierConf.border} border`}>
                  {tierConf.label}
                </span>
                {project.geographicScope && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {project.geographicScope}
                  </span>
                )}
              </div>
            </motion.a>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-12">
          <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            {locale === "fr"
              ? "Aucun projet avec des donn\u00e9es d\u2019impact pour le moment."
              : "No projects with impact data yet."}
          </p>
        </div>
      )}

      {/* Methodology Section */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-400" />
          {locale === "fr" ? "M\u00e9thodologie" : "Methodology"}
        </h2>
        <p className="text-sm text-gray-400">
          {locale === "fr"
            ? "L\u2019Index d\u2019Impact est calcul\u00e9 sur 4 dimensions de poids \u00e9gal (25% chacune) :"
            : "The Impact Index is computed across 4 equally weighted dimensions (25% each):"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="font-medium text-primary-400">
              {locale === "fr" ? "S\u00e9v\u00e9rit\u00e9 du Probl\u00e8me" : "Problem Severity"} (1-10)
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {locale === "fr"
                ? "Gravit\u00e9 du probl\u00e8me adress\u00e9, \u00e9valu\u00e9e sur une \u00e9chelle de 1 \u00e0 10."
                : "How severe the problem being addressed is, rated 1 to 10."}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="font-medium text-accent-400">
              {locale === "fr" ? "Port\u00e9e G\u00e9ographique" : "Geographic Reach"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {locale === "fr"
                ? "Local (20%), R\u00e9gional (40%), National (60%), Continental (80%), Global (100%)."
                : "Local (20%), Regional (40%), National (60%), Continental (80%), Global (100%)."}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="font-medium text-blue-400">
              {locale === "fr" ? "Niveau de Maturit\u00e9" : "Readiness Level"} (IRL 1-9)
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {locale === "fr"
                ? "Niveau de pr\u00e9paration \u00e0 l\u2019impl\u00e9mentation, inspir\u00e9 des TRL de la NASA."
                : "Implementation Readiness Level, inspired by NASA's TRL scale."}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="font-medium text-green-400">
              {locale === "fr" ? "Potentiel de Scalabilit\u00e9" : "Scalability Potential"} (1-5)
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {locale === "fr"
                ? "Capacit\u00e9 de la solution \u00e0 \u00eatre d\u00e9ploy\u00e9e \u00e0 grande \u00e9chelle."
                : "How well the solution can scale to larger populations and regions."}
            </p>
          </div>
        </div>
        <a href="/public-methodology" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
          {locale === "fr" ? "Voir la m\u00e9thodologie compl\u00e8te \u2192" : "View full methodology \u2192"}
        </a>
      </div>
    </div>
  );
}
