import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Code, Image, Wand2, Globe, Users, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getServerTranslations } from "@/i18n/server";

interface Props {
  params: { slug: string };
}

async function getSession(slug: string) {
  try {
    const session = await prisma.sandboxSession.findUnique({
      where: { shareSlug: slug },
      include: {
        creator: { select: { id: true, username: true, avatarUrl: true } },
        participants: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
        versions: {
          include: {
            author: { select: { id: true, username: true, avatarUrl: true } },
          },
          orderBy: { version: "desc" },
        },
        project: { select: { id: true, title: true } },
      },
    });

    if (!session || !session.isPublic) return null;
    return session;
  } catch {
    return null;
  }
}

export default async function SharedArenaPage({ params }: Props) {
  const { t, locale } = getServerTranslations();
  const session = await getSession(params.slug);

  if (!session) return notFound();

  const latestVersion = session.versions[0];
  const typeIcon = session.type === "text-to-code" ? Code : session.type === "text-to-image" ? Image : Wand2;
  const TypeIcon = typeIcon;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/arena"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.arena.title}
      </Link>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center shrink-0">
            <TypeIcon className="w-7 h-7 text-accent-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-medium">{t.arenaSession.publicSession}</span>
            </div>
            <h1 className="text-2xl font-bold">{session.name}</h1>
            {session.description && (
              <p className="text-gray-400 mt-1">{session.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {session.participants.length} {t.arenaSession.participants.toLowerCase()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDate(session.createdAt, locale)}
              </span>
              <span>{t.arenaSession.by} {session.creator.username}</span>
            </div>

            {/* Participant avatars */}
            <div className="flex -space-x-2 mt-3">
              {session.participants.map((p) => (
                <div
                  key={p.id}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white border-2 border-gray-900"
                  title={p.user.username}
                >
                  {p.user.username.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Latest version result */}
      {latestVersion && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-accent-400">
              v{latestVersion.version} — {latestVersion.author.username}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(latestVersion.createdAt, locale)}
            </span>
          </div>
          {latestVersion.changelog && (
            <p className="text-sm text-gray-400 mb-3 italic">{latestVersion.changelog}</p>
          )}
          <div className="bg-gray-800/80 rounded-xl p-4 border border-white/5">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
              {latestVersion.resultText}
            </pre>
          </div>
        </div>
      )}

      {/* Version history */}
      {session.versions.length > 1 && (
        <div className="card">
          <h2 className="font-semibold mb-4">
            {t.arenaSession.versionHistory} ({session.versions.length})
          </h2>
          <div className="space-y-3">
            {session.versions.slice(1).map((v) => (
              <div key={v.id} className="p-3 rounded-lg bg-gray-800/30 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-300">v{v.version}</span>
                  <span className="text-[10px] text-gray-500">{v.author.username} — {formatDate(v.createdAt, locale)}</span>
                </div>
                {v.changelog && <p className="text-xs text-gray-400">{v.changelog}</p>}
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 font-mono">{v.resultText?.slice(0, 100)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link to project */}
      {session.project && (
        <div className="card mt-6 text-center">
          <p className="text-sm text-gray-400 mb-2">Part of project:</p>
          <Link href={`/projects/${session.project.id}`} className="btn-primary inline-flex items-center gap-2">
            {session.project.title}
          </Link>
        </div>
      )}
    </div>
  );
}
