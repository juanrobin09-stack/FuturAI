import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import VoteButton from "@/components/VoteButton";
import CategoryBadge from "@/components/CategoryBadge";
import IdeaStatusBadge from "@/components/IdeaStatusBadge";
import SandboxAI from "@/components/SandboxAI";
import ShareButtons from "@/components/ShareButtons";
import IdeaComments from "@/components/IdeaComments";
import IdeaCollaborators from "@/components/IdeaCollaborators";
import { MapPin, Clock, User, ArrowLeft, Share2, TrendingUp, MessageCircle, Users } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";
import { getServerTranslations } from "@/i18n/server";
import { getAuthUserId, getCurrentUser } from "@/lib/auth";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const idea = await getIdea(params.id);
  if (!idea) return {};
  const desc = idea.description.slice(0, 160);
  return {
    title: idea.title,
    description: desc,
    openGraph: {
      title: idea.title,
      description: desc,
      url: `https://futurai.space/ideas/${idea.id}`,
      type: "article",
      images: idea.imageUrl ? [{ url: idea.imageUrl }] : ["/og-image.png"],
    },
    twitter: { card: "summary_large_image", title: idea.title, description: desc },
  };
}

async function getIdea(id: string) {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, country: true },
        },
        votes: { select: { value: true, userId: true } },
        sandbox: { orderBy: { createdAt: "desc" }, take: 5 },
        _count: { select: { ideaComments: true, collaborators: true } },
      },
    });
    return idea;
  } catch {
    return null;
  }
}

export default async function IdeaDetailPage({ params }: Props) {
  const idea = await getIdea(params.id);
  if (!idea) return notFound();

  const { t } = getServerTranslations();
  const score = idea.votes.reduce((sum, v) => sum + v.value, 0);
  const commentCount = idea._count.ideaComments;
  const collaboratorCount = idea._count.collaborators;

  let userVote = 0;
  try {
    const authId = await getAuthUserId();
    if (authId) {
      const user = await getCurrentUser();
      userVote = idea.votes.find((v) => v.userId === user.id)?.value ?? 0;
    }
  } catch {}

  const nextMilestone = score < 5 ? 5 : score < 10 ? 10 : score < 25 ? 25 : score < 50 ? 50 : 100;
  const progress = Math.min((score / nextMilestone) * 100, 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Back */}
      <Link
        href="/ideas"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.ideas.backToIdeas}
      </Link>

      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4 mb-6">
        <div className="shrink-0">
          <VoteButton ideaId={idea.id} initialScore={score} initialUserVote={userVote} size="lg" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight mb-2">{idea.title}</h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-400">
            <IdeaStatusBadge status={idea.status} score={score} collaboratorCount={collaboratorCount} />
            <CategoryBadge category={idea.category} size="md" />
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{idea.author.username}</span>
            {idea.country && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{idea.country}</span>}
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeAgo(idea.createdAt, t.time)}</span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
          {/* Image */}
          {idea.imageUrl && (
            <div className="w-full rounded-2xl overflow-hidden bg-gray-800">
              <img
                src={idea.imageUrl}
                alt={idea.title}
                className="w-full max-h-[400px] object-cover"
              />
            </div>
          )}

          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">{t.ideas.description}</h2>
            <div className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {idea.description}
            </div>
          </div>

          {/* Mobile only: Collaborators */}
          <div className="lg:hidden">
            <IdeaCollaborators ideaId={idea.id} ideaAuthorId={idea.author.id} />
          </div>

          {/* Mobile only: Quick Stats */}
          <div className="lg:hidden grid grid-cols-2 gap-3">
            <div className="card !p-3 text-center">
              <div className="text-lg font-bold text-primary-400">{score}</div>
              <div className="text-xs text-gray-500">{t.ideas.score}</div>
            </div>
            <div className="card !p-3 text-center">
              <div className="text-lg font-bold">{idea.votes.length}</div>
              <div className="text-xs text-gray-500">{t.ideas.votes}</div>
            </div>
            <div className="card !p-3 text-center">
              <div className="text-lg font-bold">{commentCount}</div>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <MessageCircle className="w-3 h-3" />
                Commentaires
              </div>
            </div>
            <div className="card !p-3 text-center">
              <div className="text-lg font-bold">{collaboratorCount}</div>
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <Users className="w-3 h-3" />
                Collaborateurs
              </div>
            </div>
          </div>

          {/* Comments */}
          <IdeaComments ideaId={idea.id} />

          {/* Sandbox */}
          <SandboxAI ideaId={idea.id} ideaTitle={idea.title} />

          {/* Previous sandbox results */}
          {idea.sandbox.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">{t.ideas.generatedPrototypes}</h3>
              <div className="space-y-3">
                {idea.sandbox.map((s) => (
                  <div key={s.id} className="card">
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                      <span className="px-2 py-0.5 bg-accent-500/10 text-accent-400 rounded text-xs">
                        {s.type}
                      </span>
                      <span>{timeAgo(s.createdAt, t.time)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Prompt: {s.prompt}</p>
                    {s.resultText && (
                      <pre className="text-sm text-gray-300 bg-gray-800/50 rounded-lg p-3 overflow-x-auto font-mono">
                        {s.resultText}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile only: Vote progress + Author + Share */}
          <div className="lg:hidden space-y-3">
            {/* Vote progress compact */}
            <div className="card !p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-primary-400 shrink-0" />
                Impact du vote
              </h3>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Palier : {nextMilestone} votes</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 text-[11px]">
                <div className={`flex items-center gap-1 ${score >= 5 ? "text-primary-400" : "text-gray-600"}`}>
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0 ${score >= 5 ? "bg-primary-500/20" : "bg-white/5"}`}>
                    {score >= 5 ? "V" : "5"}
                  </span>
                  Tendance
                </div>
                <div className={`flex items-center gap-1 ${score >= 10 ? "text-primary-400" : "text-gray-600"}`}>
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0 ${score >= 10 ? "bg-primary-500/20" : "bg-white/5"}`}>
                    {score >= 10 ? "V" : "10"}
                  </span>
                  Validation
                </div>
                <div className={`flex items-center gap-1 ${score >= 25 ? "text-primary-400" : "text-gray-600"}`}>
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0 ${score >= 25 ? "bg-primary-500/20" : "bg-white/5"}`}>
                    {score >= 25 ? "V" : "25"}
                  </span>
                  Challenge
                </div>
                <div className={`flex items-center gap-1 ${score >= 50 ? "text-primary-400" : "text-gray-600"}`}>
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0 ${score >= 50 ? "bg-primary-500/20" : "bg-white/5"}`}>
                    {score >= 50 ? "V" : "50"}
                  </span>
                  Prioritaire
                </div>
              </div>
            </div>

            {/* Author + Share inline */}
            <div className="flex gap-3">
              <div className="card !p-3 flex-1">
                <div className="flex items-center gap-2">
                  {idea.author.avatarUrl ? (
                    <img src={idea.author.avatarUrl} alt={idea.author.username} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {idea.author.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-xs truncate">{idea.author.username}</p>
                    {idea.author.country && <p className="text-[10px] text-gray-400 truncate">{idea.author.country}</p>}
                  </div>
                </div>
              </div>
              <div className="card !p-3 flex-1">
                <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                  <Share2 className="w-3 h-3" />
                  {t.share.shareOn}
                </p>
                <ShareButtons title={idea.title} url={`https://futurai.space/ideas/${idea.id}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block w-[320px] shrink-0">
          <div className="sticky top-6 space-y-4">
            {/* Collaborators */}
            <IdeaCollaborators ideaId={idea.id} ideaAuthorId={idea.author.id} />

            {/* Vote progress / milestones */}
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-400" />
                Impact du vote
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Score actuel</span>
                  <span className="font-bold text-primary-400">{score}</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Prochain palier : {nextMilestone} votes</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className={`flex items-center gap-2 ${score >= 5 ? "text-primary-400" : "text-gray-600"}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${score >= 5 ? "bg-primary-500/20" : "bg-white/5"}`}>
                      {score >= 5 ? "V" : "5"}
                    </span>
                    Tendance — visible en page d&apos;accueil
                  </div>
                  <div className={`flex items-center gap-2 ${score >= 10 ? "text-primary-400" : "text-gray-600"}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${score >= 10 ? "bg-primary-500/20" : "bg-white/5"}`}>
                      {score >= 10 ? "V" : "10"}
                    </span>
                    Validation communautaire
                  </div>
                  <div className={`flex items-center gap-2 ${score >= 25 ? "text-primary-400" : "text-gray-600"}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${score >= 25 ? "bg-primary-500/20" : "bg-white/5"}`}>
                      {score >= 25 ? "V" : "25"}
                    </span>
                    Éligible pour un challenge
                  </div>
                  <div className={`flex items-center gap-2 ${score >= 50 ? "text-primary-400" : "text-gray-600"}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${score >= 50 ? "bg-primary-500/20" : "bg-white/5"}`}>
                      {score >= 50 ? "V" : "50"}
                    </span>
                    Projet prioritaire
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="card">
              <h3 className="font-semibold mb-3">{t.ideas.statistics}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.ideas.score}</span>
                  <span className="font-bold text-primary-400">{score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.ideas.votes}</span>
                  <span>{idea.votes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    Commentaires
                  </span>
                  <span>{commentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Collaborateurs
                  </span>
                  <span>{collaboratorCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.ideas.prototypes}</span>
                  <span>{idea.sandbox.length}</span>
                </div>
              </div>
            </div>

            {/* Author */}
            <div className="card">
              <h3 className="font-semibold mb-3">{t.ideas.author}</h3>
              <div className="flex items-center gap-3">
                {idea.author.avatarUrl ? (
                  <img src={idea.author.avatarUrl} alt={idea.author.username} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                    {idea.author.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium">{idea.author.username}</p>
                  {idea.author.country && <p className="text-sm text-gray-400">{idea.author.country}</p>}
                </div>
              </div>
            </div>

            {idea.country && (
              <div className="card">
                <h3 className="font-semibold mb-3">{t.ideas.location}</h3>
                <p className="text-sm text-gray-400">{idea.country}</p>
                <Link href="/map" className="text-sm text-primary-400 hover:underline mt-2 inline-block">
                  {t.ideas.viewOnMap} &rarr;
                </Link>
              </div>
            )}

            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary-400" />
                {t.share.shareOn}
              </h3>
              <ShareButtons title={idea.title} url={`https://futurai.space/ideas/${idea.id}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
