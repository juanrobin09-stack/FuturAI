import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import StatusBadge from "@/components/StatusBadge";
import { getServerTranslations } from "@/i18n/server";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  GitBranch,
  MessageSquare,
  Code,
  Palette,
  Search,
  FlaskConical,
  UserPlus,
  Tag,
} from "lucide-react";
import { timeAgo, formatDate } from "@/lib/utils";
import { getContributionPoints } from "@/lib/points";
import ProjectDetailClient from "./ProjectDetailClient";
import ProjectPreview from "./ProjectPreview";

interface Props {
  params: { id: string };
}

async function getProject(id: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true, country: true, points: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        comments: {
          where: { parentId: null },
          include: {
            user: { select: { username: true, avatarUrl: true } },
            replies: {
              include: {
                user: { select: { username: true, avatarUrl: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        contributions: {
          include: {
            user: { select: { username: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        sandbox: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        versions: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { members: true, comments: true, contributions: true },
        },
      },
    });
    return project;
  } catch {
    return null;
  }
}

const contributionIcons: Record<string, React.ElementType> = {
  code: Code,
  design: Palette,
  research: Search,
  testing: FlaskConical,
  feedback: MessageSquare,
};

export default async function ProjectDetailPage({ params }: Props) {
  const { t, locale } = getServerTranslations();
  const project = await getProject(params.id);

  if (!project) return notFound();

  const creator = project.members.find((m) => m.role === "creator");

  // Serialize dates for client components
  const serializedComments = project.comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    user: c.user,
    replies: c.replies.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      user: r.user,
    })),
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.projects.backToProjects}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* ─── Main content ─── */}
        <div className="min-w-0">
          {/* Header */}
          <div className="mb-6">
            {project.imageUrl && (
              <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden bg-gray-800 mb-6">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <h1 className="text-2xl sm:text-3xl font-bold">{project.title}</h1>
              <StatusBadge status={project.status} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <CategoryBadge category={project.category} size="md" />
              {project.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {project.country}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {timeAgo(project.createdAt, t.time)}
              </span>
              {creator && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {t.projects.createdBy} {creator.user.username}
                </span>
              )}
            </div>
          </div>

          {/* Member avatars row */}
          {project.members.length > 0 && (
            <div className="flex items-center gap-2 mb-6">
              <div className="flex -space-x-2">
                {project.members.slice(0, 8).map((m) => (
                  <div
                    key={m.id}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 border-2 border-gray-900 flex items-center justify-center text-xs font-bold text-white"
                    title={`${m.user.username} (${m.role})`}
                  >
                    {m.user.username.charAt(0).toUpperCase()}
                  </div>
                ))}
                {project.members.length > 8 && (
                  <div className="w-9 h-9 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-xs text-gray-300">
                    +{project.members.length - 8}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {project.members.length} {project.members.length !== 1 ? t.projects.membersPlural : t.projects.member}
              </span>
            </div>
          )}

          {/* Description */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-3">{t.projects.description}</h2>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {project.description}
            </div>
          </div>

          {/* Contributions list */}
          {project.contributions.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-accent-400" />
                {t.projects.contributions} ({project.contributions.length})
              </h2>
              <div className="space-y-3">
                {project.contributions.map((c) => {
                  const Icon = contributionIcons[c.type] || Code;
                  const typeLabel =
                    t.contributionTypes[c.type] || c.type;
                  return (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-xl border border-white/5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-accent-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{c.user.username}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-accent-500/10 text-accent-400 border border-accent-500/20">
                            {typeLabel}
                          </span>
                          <span className="text-xs text-gray-500">{timeAgo(c.createdAt, t.time)}</span>
                          {c.pointsEarned > 0 && (
                            <span className="text-xs text-primary-400 ml-auto">
                              +{c.pointsEarned} pts
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{c.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Client-side interactive section: ContributionForm, CommentThread, Join button */}
          <ProjectDetailClient
            projectId={project.id}
            projectTitle={project.title}
            comments={serializedComments}
          />

          {/* Sandbox AI — Visual Preview */}
          <ProjectPreview
            results={project.sandbox.map((s) => ({
              ...s,
              createdAt: s.createdAt.toISOString(),
            }))}
          />
        </div>

        {/* ─── Sidebar ─── */}
        <div className="space-y-4">
          {/* Project stats */}
          <div className="card">
            <h3 className="font-semibold mb-3">{t.projects.statistics}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {t.projects.members}
                </span>
                <span className="font-bold text-primary-400">{project._count.members}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  {t.projects.contributions}
                </span>
                <span className="font-bold">{project._count.contributions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {t.projects.comments}
                </span>
                <span className="font-bold">{project._count.comments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  {t.projects.prototypes}
                </span>
                <span className="font-bold">{project.sandbox.length}</span>
              </div>
            </div>
          </div>

          {/* Versions */}
          {project.versions.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-primary-400" />
                {t.projects.versions}
              </h3>
              <div className="space-y-2">
                {project.versions.map((v, i) => (
                  <div
                    key={v.id}
                    className={`p-2.5 rounded-lg text-sm ${
                      i === 0
                        ? "bg-primary-500/10 border border-primary-500/20"
                        : "bg-gray-800/30 border border-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />
                        v{v.version}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(v.createdAt, locale)}</span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{v.changelog}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members list */}
          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-400" />
              {t.projects.team} ({project.members.length})
            </h3>
            <div className="space-y-2">
              {project.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {m.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.user.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{m.role}</p>
                  </div>
                  {m.user.country && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {m.user.country}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          {project.latitude && project.longitude && (
            <div className="card">
              <h3 className="font-semibold mb-3">{t.projects.location}</h3>
              <p className="text-sm text-gray-400">
                {project.country || t.projects.notSpecified}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {project.latitude.toFixed(4)}, {project.longitude.toFixed(4)}
              </p>
              <Link
                href="/map"
                className="text-sm text-primary-400 hover:underline mt-2 inline-block"
              >
                {t.projects.viewOnMap} &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

