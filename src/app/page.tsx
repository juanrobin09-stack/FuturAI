import Link from "next/link";
import {
  ArrowRight, Brain, Globe, Trophy, Lightbulb, Sparkles, Users,
  FolderKanban, Award, FlaskConical, MessageSquare, Star, TrendingUp,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { getCategoryColor, getCategoryLabel, getStatusLabel } from "@/lib/utils";
import { getServerTranslations } from "@/i18n/server";

async function getHomeData() {
  try {
    const [projects, challenges, ideaCount, userCount, topProject, topContributor] = await Promise.all([
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
      spotlight: {
        topProject: topProject ? { title: topProject.title, contributions: topProject._count.contributions } : null,
        topContributor: topContributor ? { username: topContributor.username, points: topContributor.points } : null,
        fastestGrowing: projects[0] ? { title: projects[0].title, members: projects[0]._count.members } : null,
      },
    };
  } catch {
    return { projects: [], challenges: [], ideaCount: 0, userCount: 0, spotlight: { topProject: null, topContributor: null, fastestGrowing: null } };
  }
}

export default async function HomePage() {
  const { projects, challenges, ideaCount, userCount, spotlight } = await getHomeData();
  const { t } = getServerTranslations();

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/50 via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-32 sm:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8">
              <Sparkles className="w-4 h-4 text-accent-400" />
              {t.home.badge}
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
              <span className="gradient-text">{t.home.heroTitle1}</span>
              <br />
              {t.home.heroTitle2}
              {t.home.heroTitle3 && <><br />{t.home.heroTitle3}</>}
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              {t.home.heroDescription}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/projects" className="btn-accent text-lg px-8 py-4 flex items-center gap-2">
                <FolderKanban className="w-5 h-5" />
                {t.home.joinProject}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/ideas/submit" className="btn-ghost text-lg px-8 py-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                {t.home.submitIdea}
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto">
            {[
              { icon: FolderKanban, label: t.home.activeProjects, value: `${projects.length}+` },
              { icon: Users, label: t.home.innovators, value: `${Math.max(userCount, 100)}+` },
              { icon: Globe, label: t.home.countries, value: "30+" },
              { icon: Award, label: t.home.challengesCount, value: `${challenges.length}+` },
            ].map((stat) => (
              <div key={stat.label} className="card text-center py-6">
                <stat.icon className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.map((ch) => {
              const end = new Date(ch.endDate);
              const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
              return (
                <Link key={ch.id} href={`/challenges/${ch.id}`} className="card group hover:border-accent-500/20">
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
              );
            })}
          </div>
        </section>
      )}

      {/* Global Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
          {t.spotlight.title} <span className="gradient-text">{t.spotlight.titleHighlight}</span>
        </h2>
        <p className="text-gray-400 text-center mb-8">{t.spotlight.thisWeek}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Trophy,
              title: t.spotlight.topProject,
              value: spotlight.topProject?.title ?? "—",
              metric: spotlight.topProject ? `${spotlight.topProject.contributions} ${t.spotlight.contributions}` : "",
              color: "from-yellow-500/20 to-amber-500/20",
              textColor: "text-yellow-400",
            },
            {
              icon: Star,
              title: t.spotlight.topContributor,
              value: spotlight.topContributor?.username ?? "—",
              metric: spotlight.topContributor ? `${spotlight.topContributor.points} ${t.spotlight.points}` : "",
              color: "from-primary-500/20 to-blue-500/20",
              textColor: "text-primary-400",
            },
            {
              icon: TrendingUp,
              title: t.spotlight.fastestGrowing,
              value: spotlight.fastestGrowing?.title ?? "—",
              metric: spotlight.fastestGrowing ? `${spotlight.fastestGrowing.members} ${t.home.participants}` : "",
              color: "from-green-500/20 to-emerald-500/20",
              textColor: "text-green-400",
            },
          ].map((item) => (
            <div key={item.title} className="card text-center group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-3`}>
                <item.icon className={`w-6 h-6 ${item.textColor}`} />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{item.title}</p>
              <h3 className="font-semibold text-white text-lg line-clamp-1">{item.value}</h3>
              {item.metric && <p className="text-sm text-gray-400 mt-1">{item.metric}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Top Projects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
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

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="card group hover:border-primary-500/20">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold group-hover:text-primary-300 transition-colors line-clamp-1 flex-1">
                    {project.title}
                  </h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full shrink-0 ml-2"
                    style={{
                      backgroundColor: project.status === "open" ? "#22c55e15" : "#3b82f615",
                      color: project.status === "open" ? "#22c55e" : "#3b82f6",
                    }}
                  >
                    {getStatusLabel(project.status, t.statuses)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">{project.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span
                    className="px-2 py-0.5 rounded-full"
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
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400">{t.home.noProjectsYet}</h3>
            <p className="text-sm text-gray-500 mt-2">{t.home.createFirstProject}</p>
            <Link href="/projects/create" className="btn-accent mt-4 inline-flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              {t.home.createProject}
            </Link>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
          {t.home.completePlatform} <span className="gradient-text">{t.home.completePlatformHighlight}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: FolderKanban, title: t.home.featProjects, desc: t.home.featProjectsDesc },
            { icon: Award, title: t.home.featChallenges, desc: t.home.featChallengesDesc },
            { icon: FlaskConical, title: t.home.featArena, desc: t.home.featArenaDesc },
            { icon: Globe, title: t.home.featMap, desc: t.home.featMapDesc },
          ].map((f) => (
            <div key={f.title} className="card text-center group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-7 h-7 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
