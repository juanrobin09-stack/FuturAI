import Link from "next/link";
import {
  ArrowRight, Brain, Globe, Trophy, Lightbulb, Sparkles, Users,
  FolderKanban, Award, FlaskConical, MessageSquare, Star, TrendingUp,
  Zap, Shield, BarChart3, Layers,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { getCategoryColor, getCategoryLabel, getStatusLabel } from "@/lib/utils";
import { getServerTranslations } from "@/i18n/server";
import FadeIn from "@/components/animations/FadeIn";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerList";
import AnimatedCounter from "@/components/AnimatedCounter";

const MIN_STATS_THRESHOLD = 10;

async function getHomeData() {
  try {
    const [projects, challenges, ideaCount, userCount, projectCount, challengeCount, topProject, topContributor] = await Promise.all([
      prisma.project.findMany({
        include: {
          members: { include: { user: { select: { username: true } } }, take: 4 },
          _count: { select: { members: true, comments: true, contributions: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.challenge.findMany({
        where: { status: "open" },
        include: { _count: { select: { entries: true } } },
        orderBy: { endDate: "asc" },
        take: 3,
      }),
      prisma.idea.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.challenge.count(),
      prisma.project.findFirst({
        include: { _count: { select: { contributions: true, members: true } } },
        orderBy: { contributions: { _count: "desc" } },
      }),
      prisma.user.findFirst({
        orderBy: { points: "desc" },
        select: { username: true, points: true },
      }),
    ]);
    return {
      projects: projects.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
      challenges: challenges.map((c) => ({
        ...c,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate.toISOString(),
      })),
      ideaCount,
      userCount,
      projectCount,
      challengeCount,
      showCommunityStats: userCount >= MIN_STATS_THRESHOLD,
      spotlight: {
        topProject: topProject ? { title: topProject.title, contributions: topProject._count.contributions } : null,
        topContributor: topContributor ? { username: topContributor.username, points: topContributor.points } : null,
        fastestGrowing: projects[0] ? { title: projects[0].title, members: projects[0]._count.members } : null,
      },
    };
  } catch {
    return { projects: [], challenges: [], ideaCount: 0, userCount: 0, projectCount: 0, challengeCount: 0, showCommunityStats: false, spotlight: { topProject: null, topContributor: null, fastestGrowing: null } };
  }
}

export default async function HomePage() {
  const { projects, challenges, ideaCount, userCount, projectCount, challengeCount, showCommunityStats, spotlight } = await getHomeData();
  const { t } = getServerTranslations();

  const hasSpotlight = spotlight.topProject && spotlight.topContributor && spotlight.topProject.contributions > 0;

  return (
    <div className="relative">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/50 via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] sm:h-[600px] bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-full blur-3xl" />
        {/* Animated orbs */}
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-1/4 w-48 h-48 bg-accent-500/5 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-16 sm:pt-32 sm:pb-28">
          <div className="text-center max-w-4xl mx-auto">
            <FadeIn delay={0.1}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm text-gray-300 mb-6 sm:mb-8">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-400" />
                {t.home.badge}
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black leading-tight mb-4 sm:mb-6">
                <span className="gradient-text">{t.home.heroTitle1}</span>
                {t.home.heroTitle2 && <><br />{t.home.heroTitle2}</>}
                {t.home.heroTitle3 && <><br />{t.home.heroTitle3}</>}
              </h1>
            </FadeIn>

            <FadeIn delay={0.35}>
              <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-10">
                {t.home.heroDescription}
              </p>
            </FadeIn>

            <FadeIn delay={0.5}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link href="/arena" className="btn-accent text-sm sm:text-lg px-6 py-3 sm:px-8 sm:py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
                  <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t.home.exploreArena}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <Link href="/projects" className="btn-ghost text-sm sm:text-lg px-6 py-3 sm:px-8 sm:py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
                  <FolderKanban className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t.home.joinProject}
                </Link>
              </div>
            </FadeIn>
          </div>

          {/* Platform Capabilities */}
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-12 sm:mt-20 max-w-3xl mx-auto" staggerDelay={0.12}>
            {[
              { icon: Zap, label: t.home.statProviders, value: "9" },
              { icon: Shield, label: t.home.statEncryption, value: "AES-256" },
              { icon: Layers, label: t.home.statModes, value: "3" },
              { icon: BarChart3, label: t.home.statImpactScore, value: "100" },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="card text-center py-4 sm:py-6">
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400 mx-auto mb-2" />
                  <div className="text-xl sm:text-2xl font-bold gradient-text">
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Features — Arena first, highlighted ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <FadeIn>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
            {t.home.completePlatform} <span className="gradient-text">{t.home.completePlatformHighlight}</span>
          </h2>
          <p className="text-gray-400 text-center mb-10 max-w-xl mx-auto text-sm sm:text-base">{t.home.platformSubtitle}</p>
        </FadeIn>
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6" staggerDelay={0.1}>
          {[
            { icon: FlaskConical, title: t.home.featArena, desc: t.home.featArenaDesc, highlight: true },
            { icon: FolderKanban, title: t.home.featProjects, desc: t.home.featProjectsDesc, highlight: false },
            { icon: Award, title: t.home.featChallenges, desc: t.home.featChallengesDesc, highlight: false },
            { icon: Globe, title: t.home.featMap, desc: t.home.featMapDesc, highlight: false },
          ].map((f) => (
            <StaggerItem key={f.title}>
              <div className={`card text-center group ${f.highlight ? "border-primary-500/30 bg-primary-500/5 ring-1 ring-primary-500/10" : ""}`}>
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${f.highlight ? "from-primary-500/30 to-accent-500/30" : "from-primary-500/20 to-accent-500/20"} flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-5 h-5 sm:w-7 sm:h-7 ${f.highlight ? "text-accent-400" : "text-primary-400"}`} />
                </div>
                <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">{f.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">{f.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ─── Community Stats — only when impressive ─── */}
      {showCommunityStats && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <FadeIn>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
              {t.home.communityTitle} <span className="gradient-text">{t.home.communityTitleHighlight}</span>
            </h2>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 max-w-3xl mx-auto" staggerDelay={0.1}>
            {[
              { icon: FolderKanban, label: t.home.activeProjects, value: String(projectCount) },
              { icon: Users, label: t.home.innovators, value: String(userCount) },
              { icon: Lightbulb, label: t.home.ideasCount || "Ideas", value: String(ideaCount) },
              { icon: Award, label: t.home.challengesCount, value: String(challengeCount) },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="card text-center py-4 sm:py-6">
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-accent-400 mx-auto mb-2" />
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}

      {/* ─── Active Challenges ─── */}
      {challenges.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <FadeIn>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  <span className="gradient-text">{t.home.activeChallenges}</span>
                </h2>
                <p className="text-gray-400 mt-1">{t.home.participateWinBadges}</p>
              </div>
              <Link href="/challenges" className="btn-ghost text-sm py-2 px-4 hidden sm:flex items-center gap-2">
                {t.home.allChallenges} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.map((ch) => {
              const end = new Date(ch.endDate);
              const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
              return (
                <StaggerItem key={ch.id}>
                  <Link href={`/challenges/${ch.id}`} className="card group hover:border-accent-500/20 block">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center">
                        <Award className="w-5 h-5 text-accent-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-accent-300 transition-colors line-clamp-1">{ch.title}</h3>
                        <p className="text-xs text-gray-500">
                          {t.home.daysLeft.replace("{n}", String(daysLeft))} &middot; {ch._count.entries} {t.home.participants}
                        </p>
                      </div>
                    </div>
                    {ch.prize && (
                      <div className="px-3 py-1.5 bg-accent-500/10 rounded-lg text-sm text-accent-300 border border-accent-500/20">
                        {ch.prize}
                      </div>
                    )}
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>
      )}

      {/* ─── Global Spotlight — only when meaningful ─── */}
      {hasSpotlight && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
              {t.spotlight.title} <span className="gradient-text">{t.spotlight.titleHighlight}</span>
            </h2>
            <p className="text-gray-400 text-center mb-8">{t.spotlight.thisWeek}</p>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Trophy,
                title: t.spotlight.topProject,
                value: spotlight.topProject?.title ?? "\u2014",
                metric: spotlight.topProject ? `${spotlight.topProject.contributions} ${t.spotlight.contributions}` : "",
                color: "from-yellow-500/20 to-amber-500/20",
                textColor: "text-yellow-400",
              },
              {
                icon: Star,
                title: t.spotlight.topContributor,
                value: spotlight.topContributor?.username ?? "\u2014",
                metric: spotlight.topContributor ? `${spotlight.topContributor.points} ${t.spotlight.points}` : "",
                color: "from-primary-500/20 to-blue-500/20",
                textColor: "text-primary-400",
              },
              {
                icon: TrendingUp,
                title: t.spotlight.fastestGrowing,
                value: spotlight.fastestGrowing?.title ?? "\u2014",
                metric: spotlight.fastestGrowing ? `${spotlight.fastestGrowing.members} ${t.home.participants}` : "",
                color: "from-green-500/20 to-emerald-500/20",
                textColor: "text-green-400",
              },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <div className="card text-center group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-3`}>
                    <item.icon className={`w-6 h-6 ${item.textColor}`} />
                  </div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{item.title}</p>
                  <h3 className="font-semibold text-white text-lg line-clamp-1">{item.value}</h3>
                  {item.metric && <p className="text-sm text-gray-400 mt-1">{item.metric}</p>}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}

      {/* ─── Projects — only if there are some ─── */}
      {projects.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <FadeIn>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  {t.home.collaborativeProjects} <span className="gradient-text">{t.home.collaborativeProjectsHighlight}</span>
                </h2>
                <p className="text-gray-400 mt-1">{t.home.joinTeamBuild}</p>
              </div>
              <Link href="/projects" className="btn-ghost text-sm py-2 px-4 hidden sm:flex items-center gap-2">
                {t.common.seeAll} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <StaggerItem key={project.id}>
                <Link href={`/projects/${project.id}`} className="card group hover:border-primary-500/20 block">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold group-hover:text-primary-300 transition-colors line-clamp-1 flex-1">
                      {project.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                        project.status === "open"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {getStatusLabel(project.status, t.statuses)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">{project.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span
                      className="px-2 py-0.5 rounded-full border border-white/5"
                      style={{ backgroundColor: `${getCategoryColor(project.category)}15`, color: getCategoryColor(project.category) }}
                    >
                      {getCategoryLabel(project.category, t.categories)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{project._count.members}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{project._count.comments}</span>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}
    </div>
  );
}
