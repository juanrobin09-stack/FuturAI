"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart3, Globe, Users, TrendingUp, Target, Loader2,
  Zap, ArrowUpRight, Layers, Activity, ChevronRight,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/i18n";
import { computeImpactIndex, IMPACT_TIERS } from "@/lib/impact";

/* ── Types ───────────────────────────────────────────────────────── */
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

/* ── Animated counter ────────────────────────────────────────────── */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ── Radial progress ring ────────────────────────────────────────── */
function RadialProgress({ value, size = 120, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="url(#gradient)" strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        strokeDasharray={circumference}
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Mini bar for breakdowns ─────────────────────────────────────── */
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

/* ── Tier distribution bar ───────────────────────────────────────── */
function TierDistribution({ projects, locale }: { projects: { tier: string }[]; locale: string }) {
  const total = projects.length || 1;
  const counts = {
    transformative: projects.filter((p) => p.tier === "transformative").length,
    "high-impact": projects.filter((p) => p.tier === "high-impact").length,
    promising: projects.filter((p) => p.tier === "promising").length,
    exploratory: projects.filter((p) => p.tier === "exploratory").length,
  };

  const segments = [
    { key: "transformative", color: "bg-emerald-500", label: locale === "fr" ? "Transformatif" : "Transformative", count: counts.transformative },
    { key: "high-impact", color: "bg-amber-500", label: locale === "fr" ? "Haut impact" : "High Impact", count: counts["high-impact"] },
    { key: "promising", color: "bg-blue-500", label: locale === "fr" ? "Prometteur" : "Promising", count: counts.promising },
    { key: "exploratory", color: "bg-gray-500", label: locale === "fr" ? "Exploratoire" : "Exploratory", count: counts.exploratory },
  ];

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-white/5">
        {segments.map((seg) =>
          seg.count > 0 ? (
            <motion.div
              key={seg.key}
              className={`${seg.color} h-full`}
              initial={{ width: 0 }}
              animate={{ width: `${(seg.count / total) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            />
          ) : null,
        )}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
            <span>{seg.label}</span>
            <span className="font-semibold text-white">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */
export default function ImpactDashboardPage() {
  const { t, locale } = useLanguage();
  const [projects, setProjects] = useState<ProjectWithImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterScope, setFilterScope] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Compute impact for all
  const projectsWithImpact = projects.map((p) => ({
    ...p,
    impact: computeImpactIndex(p),
  }));

  // Filter
  const filtered = projectsWithImpact.filter((p) => {
    if (filterScope !== "all" && p.geographicScope !== filterScope) return false;
    if (filterTier !== "all" && p.impact.tier !== filterTier) return false;
    return true;
  });

  // Sort by impact (highest first)
  const sorted = [...filtered].sort((a, b) => b.impact.impactIndex - a.impact.impactIndex);

  // Aggregate stats
  const totalProjects = projects.length;
  const countriesSet = new Set(projects.map((p) => p.country).filter(Boolean));
  const totalContributors = projects.reduce((s, p) => s + (p._count?.members || 0), 0);
  const avgImpact = projectsWithImpact.length > 0
    ? Math.round(projectsWithImpact.reduce((s, p) => s + p.impact.impactIndex, 0) / projectsWithImpact.length)
    : 0;

  // Top 3 for spotlight
  const top3 = [...projectsWithImpact].sort((a, b) => b.impact.impactIndex - a.impact.impactIndex).slice(0, 3);

  const scopes = [
    { key: "all", label: locale === "fr" ? "Toutes" : "All" },
    { key: "local", label: "Local" },
    { key: "regional", label: locale === "fr" ? "Régional" : "Regional" },
    { key: "national", label: "National" },
    { key: "continental", label: "Continental" },
    { key: "global", label: "Global" },
  ];

  const tiers = [
    { key: "all", label: locale === "fr" ? "Tous" : "All" },
    { key: "transformative", label: locale === "fr" ? "Transformatif" : "Transformative" },
    { key: "high-impact", label: locale === "fr" ? "Haut impact" : "High Impact" },
    { key: "promising", label: locale === "fr" ? "Prometteur" : "Promising" },
    { key: "exploratory", label: locale === "fr" ? "Exploratoire" : "Exploratory" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        <p className="text-sm text-gray-500">{locale === "fr" ? "Chargement des données…" : "Loading data…"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/5">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-primary-500/10 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary-500/20 bg-primary-500/5 text-primary-400 text-xs font-medium">
              <Activity className="w-3.5 h-3.5" />
              {locale === "fr" ? "Données en temps réel" : "Real-time data"}
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              <span className="gradient-text">{locale === "fr" ? "Tableau de Bord" : "Impact"}</span>{" "}
              <span className="text-white">{locale === "fr" ? "Impact" : "Dashboard"}</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg">
              {locale === "fr"
                ? "Mesure transparente et vérifiable de l'impact des projets sur les défis mondiaux."
                : "Transparent, verifiable measurement of project impact on global challenges."}
            </p>
          </motion.div>

          {/* ─── Stats Row ─────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-10">
            {/* Radial chart — avg impact (wide card) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="col-span-2 lg:col-span-1 row-span-2 card flex flex-col items-center justify-center gap-2"
            >
              <div className="relative">
                <RadialProgress value={avgImpact} size={110} strokeWidth={8} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white"><AnimatedNumber value={avgImpact} /></p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">/100</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                {locale === "fr" ? "Impact moyen" : "Avg Impact"}
              </p>
            </motion.div>

            {/* Stat cards */}
            {[
              { icon: Target, value: totalProjects, label: locale === "fr" ? "Projets" : "Projects", color: "from-primary-500/20 to-primary-500/5", iconColor: "text-primary-400" },
              { icon: Globe, value: countriesSet.size, label: locale === "fr" ? "Pays" : "Countries", color: "from-accent-500/20 to-accent-500/5", iconColor: "text-accent-400" },
              { icon: Users, value: totalContributors, label: locale === "fr" ? "Contributeurs" : "Contributors", color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-400" },
              { icon: TrendingUp, value: Math.max(...projectsWithImpact.map((p) => p.impact.impactIndex), 0), label: locale === "fr" ? "Meilleur score" : "Top Score", color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-400" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className={`card bg-gradient-to-br ${stat.color} flex items-center gap-4`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white leading-none">
                    <AnimatedNumber value={stat.value} />
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ─── Tier Distribution ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-white">
              {locale === "fr" ? "Répartition par niveau d'impact" : "Impact Tier Distribution"}
            </h2>
          </div>
          <TierDistribution
            projects={projectsWithImpact.map((p) => ({ tier: p.impact.tier }))}
            locale={locale}
          />
        </motion.div>

        {/* ─── Top 3 Spotlight ───────────────────────────── */}
        {top3.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent-400" />
                <h2 className="font-semibold text-white">
                  {locale === "fr" ? "Projets les plus impactants" : "Top Impact Projects"}
                </h2>
              </div>
              <Link
                href="/projects"
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                {locale === "fr" ? "Tout voir" : "View all"}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {top3.map((project, i) => {
                const tierConf = IMPACT_TIERS[project.impact.tier];
                const medal = ["🥇", "🥈", "🥉"][i];
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                  >
                    <Link
                      href={`/projects/${project.id}`}
                      className="card group relative overflow-hidden block h-full hover:border-primary-500/30"
                    >
                      {/* Rank gradient accent */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="flex items-start gap-3 mb-4">
                        <span className="text-2xl leading-none">{medal}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-white transition-colors">
                            {project.title}
                          </h3>
                          {project.country && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {project.country}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-2xl font-bold ${tierConf.color}`}>{project.impact.impactIndex}</p>
                          <p className="text-[10px] text-gray-500">/100</p>
                        </div>
                      </div>

                      {/* Breakdown mini bars */}
                      <div className="space-y-2">
                        {[
                          { label: locale === "fr" ? "Sévérité" : "Severity", value: project.impact.breakdown.severityScore, color: "bg-primary-500" },
                          { label: locale === "fr" ? "Portée" : "Reach", value: project.impact.breakdown.reachScore, color: "bg-accent-500" },
                          { label: "IRL", value: project.impact.breakdown.readinessScore, color: "bg-blue-500" },
                          { label: locale === "fr" ? "Scalabilité" : "Scalability", value: project.impact.breakdown.scalabilityScore, color: "bg-emerald-500" },
                        ].map((dim) => (
                          <div key={dim.label} className="space-y-0.5">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-gray-500">{dim.label}</span>
                              <span className="text-gray-300 font-medium">{dim.value}/25</span>
                            </div>
                            <MiniBar value={dim.value} max={25} color={dim.color} />
                          </div>
                        ))}
                      </div>

                      {/* Tier badge */}
                      <div className="mt-4 flex items-center justify-between">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full ${tierConf.bg} ${tierConf.color} ${tierConf.border} border font-medium`}>
                          {tierConf.label}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-primary-400 transition-colors" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─── Filters ───────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <BarChart3 className="w-4 h-4" />
            <span className="font-medium text-white">
              {locale === "fr" ? "Tous les projets" : "All Projects"}
            </span>
            <span className="text-gray-600">·</span>
            <span>{sorted.length} {locale === "fr" ? "résultats" : "results"}</span>
          </div>

          {/* Scope pills */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center mr-1">
              {locale === "fr" ? "Portée" : "Scope"}:
            </span>
            {scopes.map((s) => (
              <button
                key={s.key}
                onClick={() => setFilterScope(s.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterScope === s.key
                    ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                    : "bg-white/5 text-gray-400 border border-white/5 hover:border-white/15 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Tier pills */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center mr-1">
              {locale === "fr" ? "Niveau" : "Tier"}:
            </span>
            {tiers.map((tier) => (
              <button
                key={tier.key}
                onClick={() => setFilterTier(tier.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterTier === tier.key
                    ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                    : "bg-white/5 text-gray-400 border border-white/5 hover:border-white/15 hover:text-white"
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Project Grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((project, i) => {
            const tierConf = IMPACT_TIERS[project.impact.tier];
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
              >
                <Link
                  href={`/projects/${project.id}`}
                  className="card group relative overflow-hidden block h-full hover:border-primary-500/20"
                >
                  {/* Top accent */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-white transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{project.category}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-xl font-bold ${tierConf.color}`}>{project.impact.impactIndex}</p>
                    </div>
                  </div>

                  {/* Impact progress bar */}
                  <div className="w-full h-1.5 bg-white/5 rounded-full mb-3 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${project.impact.impactIndex}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: Math.min(i * 0.04, 0.4) + 0.2 }}
                    />
                  </div>

                  {/* Breakdown */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: locale === "fr" ? "Sév." : "Sev.", value: project.impact.breakdown.severityScore, color: "text-primary-400" },
                      { label: locale === "fr" ? "Port." : "Reach", value: project.impact.breakdown.reachScore, color: "text-accent-400" },
                      { label: "IRL", value: project.impact.breakdown.readinessScore, color: "text-blue-400" },
                      { label: locale === "fr" ? "Scal." : "Scale", value: project.impact.breakdown.scalabilityScore, color: "text-emerald-400" },
                    ].map((dim) => (
                      <div key={dim.label} className="text-center">
                        <p className={`text-xs font-semibold ${dim.color}`}>{dim.value}</p>
                        <p className="text-[9px] text-gray-600">{dim.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${tierConf.bg} ${tierConf.color} ${tierConf.border} border font-medium`}>
                      {tierConf.label}
                    </span>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      {project.geographicScope && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {project.geographicScope}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {project._count?.members || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {sorted.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">
              {locale === "fr"
                ? "Aucun projet ne correspond à ces filtres."
                : "No projects match these filters."}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {locale === "fr" ? "Essayez d'ajuster les critères." : "Try adjusting the filters."}
            </p>
            <button
              onClick={() => { setFilterScope("all"); setFilterTier("all"); }}
              className="mt-4 text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              {locale === "fr" ? "Réinitialiser les filtres" : "Reset filters"}
            </button>
          </motion.div>
        )}

        {/* ─── Methodology ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary-400" />
              </div>
              <h2 className="font-semibold text-white">
                {locale === "fr" ? "Méthodologie" : "Methodology"}
              </h2>
            </div>
            <Link
              href="/public-methodology"
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
            >
              {locale === "fr" ? "Détails" : "Details"}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-sm text-gray-400">
            {locale === "fr"
              ? "L'Index d'Impact est calculé sur 4 dimensions de poids égal (25% chacune), transparentes et vérifiables."
              : "The Impact Index is computed across 4 equally weighted dimensions (25% each), fully transparent and verifiable."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: "🎯",
                title: locale === "fr" ? "Sévérité du Problème" : "Problem Severity",
                range: "1-10 → 0-25",
                desc: locale === "fr"
                  ? "Gravité du problème adressé par le projet."
                  : "How severe the problem being addressed is.",
                color: "from-primary-500/10 to-transparent border-primary-500/10",
              },
              {
                icon: "🌍",
                title: locale === "fr" ? "Portée Géographique" : "Geographic Reach",
                range: "20%–100% → 0-25",
                desc: locale === "fr"
                  ? "De local (20%) à global (100%)."
                  : "From local (20%) to global (100%).",
                color: "from-accent-500/10 to-transparent border-accent-500/10",
              },
              {
                icon: "🔬",
                title: locale === "fr" ? "Niveau de Maturité" : "Readiness Level",
                range: "IRL 1-9 → 0-25",
                desc: locale === "fr"
                  ? "Niveau de préparation, inspiré des TRL de la NASA."
                  : "Implementation readiness, inspired by NASA's TRL.",
                color: "from-blue-500/10 to-transparent border-blue-500/10",
              },
              {
                icon: "🚀",
                title: locale === "fr" ? "Potentiel de Scalabilité" : "Scalability Potential",
                range: "1-5 → 0-25",
                desc: locale === "fr"
                  ? "Capacité à être déployé à grande échelle."
                  : "How well it can scale to larger regions.",
                color: "from-emerald-500/10 to-transparent border-emerald-500/10",
              },
            ].map((dim) => (
              <div
                key={dim.title}
                className={`bg-gradient-to-br ${dim.color} border rounded-xl p-4 space-y-1`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{dim.icon}</span>
                  <p className="font-medium text-sm text-white">{dim.title}</p>
                </div>
                <p className="text-[11px] text-gray-500 font-mono">{dim.range}</p>
                <p className="text-xs text-gray-400">{dim.desc}</p>
              </div>
            ))}
          </div>

          {/* Formula */}
          <div className="bg-gray-800/30 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 font-mono">
              Impact Index = Severity(25%) + Reach(25%) + IRL(25%) + Scalability(25%)
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
