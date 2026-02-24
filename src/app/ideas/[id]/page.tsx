import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import VoteButton from "@/components/VoteButton";
import CategoryBadge from "@/components/CategoryBadge";
import SandboxAI from "@/components/SandboxAI";
import { MapPin, Clock, User, ArrowLeft } from "lucide-react";
import { timeAgo, formatDate, getCategoryLabel } from "@/lib/utils";
import Link from "next/link";
import { getServerTranslations } from "@/i18n/server";

interface Props {
  params: { id: string };
}

async function getIdea(id: string) {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id },
      include: {
        author: {
          select: { username: true, avatarUrl: true, country: true },
        },
        votes: { select: { value: true, userId: true } },
        sandbox: { orderBy: { createdAt: "desc" }, take: 5 },
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

  const { t, locale } = getServerTranslations();
  const score = idea.votes.reduce((sum, v) => sum + v.value, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link
        href="/ideas"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.ideas.backToIdeas}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8">
        {/* Main content */}
        <div>
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <VoteButton ideaId={idea.id} initialScore={score} size="lg" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{idea.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <CategoryBadge category={idea.category} size="md" />
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {idea.author.username}
                </span>
                {idea.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {idea.country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {timeAgo(idea.createdAt, t.time)}
                </span>
              </div>
            </div>
          </div>

          {/* Image */}
          {idea.imageUrl && (
            <div className="w-full rounded-2xl overflow-hidden bg-gray-800 mb-6">
              <img
                src={idea.imageUrl}
                alt={idea.title}
                className="w-full max-h-[400px] object-cover"
              />
            </div>
          )}

          {/* Description */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-3">{t.ideas.description}</h2>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {idea.description}
            </div>
          </div>

          {/* Sandbox */}
          <SandboxAI ideaId={idea.id} ideaTitle={idea.title} />

          {/* Previous sandbox results */}
          {idea.sandbox.length > 0 && (
            <div className="mt-6">
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
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-3">{t.ideas.author}</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                {idea.author.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{idea.author.username}</p>
                {idea.author.country && (
                  <p className="text-sm text-gray-400">{idea.author.country}</p>
                )}
              </div>
            </div>
          </div>

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
                <span className="text-gray-400">{t.ideas.prototypes}</span>
                <span>{idea.sandbox.length}</span>
              </div>
            </div>
          </div>

          {idea.latitude && idea.longitude && (
            <div className="card">
              <h3 className="font-semibold mb-3">{t.ideas.location}</h3>
              <p className="text-sm text-gray-400">
                {idea.country || t.ideas.notSpecified}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {idea.latitude.toFixed(4)}, {idea.longitude.toFixed(4)}
              </p>
              <Link
                href="/map"
                className="text-sm text-primary-400 hover:underline mt-2 inline-block"
              >
                {t.ideas.viewOnMap} &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
