import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Clock,
  Users,
  Award,
  Calendar,
  ExternalLink,
  Medal,
  Target,
  Plus,
  BookOpen,
  Shield,
  Globe,
} from "lucide-react";
import { formatDate, timeAgo } from "@/lib/utils";
import ChallengeCountdown from "./ChallengeCountdown";
import ChallengeDetailClient from "./ChallengeDetailClient";
import ChallengeEntryVote from "@/components/ChallengeEntryVote";
import LiveChallengeUpdates from "./LiveChallengeUpdates";
import { getServerTranslations } from "@/i18n/server";
import { getCurrentUser } from "@/lib/auth";

interface Props {
  params: { id: string };
}

async function getChallenge(id: string) {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true, country: true },
            },
            project: {
              select: { id: true, title: true, status: true },
            },
          },
          orderBy: { score: "desc" },
        },
      },
    });
    return challenge;
  } catch {
    return null;
  }
}

async function ExpertPanelSection({ challengeId }: { challengeId: string }) {
  const { t } = getServerTranslations();
  const panels = await prisma.challengePanel.findMany({
    where: { challengeId },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true, role: true } },
      _count: { select: { evaluations: true } },
    },
    orderBy: { assignedAt: "desc" },
  });

  if (panels.length === 0) return null;

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-purple-400" />
        {t.challengeDetail.expertPanel} ({panels.length})
      </h2>
      <div className="space-y-2">
        {panels.map((panel) => (
          <div key={panel.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/30">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {panel.user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{panel.user.username}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">
                  {panel.role === "EXPERT_INSTITUTION" ? t.userRoles.EXPERT_INSTITUTION : t.userRoles.EXPERT_VOLUNTEER}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {panel._count.evaluations} {t.challengeDetail.evaluationsCount}
              </span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              panel.status === "accepted" ? "bg-green-500/15 text-green-400" :
              panel.status === "declined" ? "bg-red-500/15 text-red-400" :
              "bg-yellow-500/15 text-yellow-400"
            }`}>
              {panel.status === "accepted" ? t.challengeDetail.accepted :
               panel.status === "declined" ? t.challengeDetail.declined :
               t.challengeDetail.invited}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getTypeLabel(type: string, t: any): string {
  switch (type) {
    case "weekly":
      return t.challenges.typeWeekly;
    case "monthly":
      return t.challenges.typeMonthly;
    case "special":
      return t.challenges.typeSpecial;
    default:
      return type;
  }
}

function getStatusInfo(status: string, t: any): { label: string; color: string } {
  switch (status) {
    case "open":
      return { label: t.challenges.statusOpen, color: "#22c55e" };
    case "voting":
      return { label: t.challenges.statusVoting, color: "#eab308" };
    case "closed":
      return { label: t.challenges.statusClosed, color: "#6b7280" };
    default:
      return { label: status, color: "#6b7280" };
  }
}

export default async function ChallengeDetailPage({ params }: Props) {
  const { t, locale } = getServerTranslations();
  const challenge = await getChallenge(params.id);

  if (!challenge) return notFound();

  // Fetch current user's projects for the entry form
  let userProjects: { id: string; title: string }[] = [];
  try {
    const user = await getCurrentUser();
    const memberships = await prisma.projectMember.findMany({
      where: { userId: user.id },
      include: { project: { select: { id: true, title: true } } },
    });
    userProjects = memberships.map((m) => m.project);
  } catch {
    // Not logged in or no projects
  }

  const statusInfo = getStatusInfo(challenge.status, t);
  const isOpen = challenge.status === "open";
  const isVoting = challenge.status === "voting";
  const now = new Date();
  const end = new Date(challenge.endDate);
  const start = new Date(challenge.startDate);
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

  // Sort entries: highest score first
  const rankedEntries = [...challenge.entries].sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link
        href="/challenges"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.challenges.backToChallenges}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* ─── Main content ─── */}
        <div className="min-w-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center shrink-0">
                <Trophy className={`w-7 h-7 ${isOpen ? "text-accent-400" : "text-gray-500"}`} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {/* Status badge */}
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${statusInfo.color}15`,
                      color: statusInfo.color,
                      border: `1px solid ${statusInfo.color}30`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mr-1.5"
                      style={{ backgroundColor: statusInfo.color }}
                    />
                    {statusInfo.label}
                  </span>
                  {/* Type badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    challenge.type === "weekly"
                      ? "bg-primary-500/15 text-primary-400 border border-primary-500/30"
                      : challenge.type === "monthly"
                      ? "bg-accent-500/15 text-accent-400 border border-accent-500/30"
                      : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                  }`}>
                    {getTypeLabel(challenge.type, t)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">{challenge.title}</h1>
              </div>
            </div>

            {/* Dates row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(challenge.startDate, locale)} — {formatDate(challenge.endDate, locale)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {challenge.entries.length} {t.challenges.participations}
              </span>
            </div>

            {/* Prize */}
            {challenge.prize && (
              <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-accent-500/10 to-primary-500/10 rounded-xl border border-accent-500/20">
                <Award className="w-6 h-6 text-primary-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{t.challenges.reward}</p>
                  <p className="text-lg font-bold text-accent-300">{challenge.prize}</p>
                </div>
              </div>
            )}

            {/* Progress bar for open challenges */}
            {isOpen && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>{t.challenges.progression}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Countdown for active challenges */}
            {isOpen && (
              <ChallengeCountdown endDate={challenge.endDate.toISOString()} />
            )}
          </div>

          {/* Description */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-400" />
              {t.challenges.challengeDescription}
            </h2>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {challenge.description}
            </div>
          </div>

          {/* V6.3: Structured sections */}
          {(challenge.context || challenge.measurableGoal || challenge.evaluationCriteria || challenge.impactArea || challenge.sdgAlignment) && (
            <div className="card mb-6 space-y-4">
              {challenge.context && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-primary-400" />
                    {t.challengeDetail.context}
                  </h3>
                  <p className="text-sm text-gray-400 whitespace-pre-wrap">{challenge.context}</p>
                </div>
              )}
              {challenge.measurableGoal && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-accent-400" />
                    {t.challengeDetail.measurableGoal}
                  </h3>
                  <p className="text-sm text-gray-400 whitespace-pre-wrap">{challenge.measurableGoal}</p>
                </div>
              )}
              {challenge.evaluationCriteria && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-yellow-400" />
                    {t.challengeDetail.evaluationCriteria}
                  </h3>
                  <p className="text-sm text-gray-400 whitespace-pre-wrap">{challenge.evaluationCriteria}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                {challenge.impactArea && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Globe className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400">{t.challengeDetail.impactArea}:</span>
                    <span className="font-medium text-white">{challenge.impactArea}</span>
                  </div>
                )}
                {challenge.sdgAlignment && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-gray-400">{t.challengeDetail.sdgAlignment}:</span>
                    <span className="font-medium text-white">SDG {challenge.sdgAlignment}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expert Panel */}
          <ExpertPanelSection challengeId={params.id} />

          {/* Live updates */}
          <LiveChallengeUpdates
            challengeId={params.id}
            initialEntryCount={challenge.entries.length}
          />

          {/* Participate form */}
          <ChallengeDetailClient
            challengeId={params.id}
            isOpen={isOpen}
            isVoting={isVoting}
            userProjects={userProjects}
          />

          {/* Entries */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Medal className="w-5 h-5 text-accent-400" />
              {t.challenges.participations} ({rankedEntries.length})
            </h2>

            {rankedEntries.length > 0 ? (
              <div className="space-y-3">
                {rankedEntries.map((entry, index) => {
                  const isTop3 = index < 3;
                  const medalColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isTop3
                          ? "bg-accent-500/5 border-accent-500/15"
                          : "bg-gray-800/30 border-white/5"
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                        {isTop3 ? (
                          <Trophy className={`w-4 h-4 ${medalColors[index]}`} />
                        ) : (
                          <span className="text-sm font-bold text-gray-500">
                            {index + 1}
                          </span>
                        )}
                      </div>

                      {/* User avatar */}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {entry.user.username.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {entry.user.username}
                          </span>
                          {entry.user.country && (
                            <span className="text-xs text-gray-500">{entry.user.country}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-1">
                          {entry.description}
                        </p>
                        {entry.project && (
                          <Link
                            href={`/projects/${entry.project.id}`}
                            className="text-xs text-primary-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            {entry.project.title}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <p className={`text-lg font-bold ${isTop3 ? "text-accent-400" : "text-gray-400"}`}>
                          {entry.score}
                        </p>
                        <p className="text-xs text-gray-500">{t.common.points}</p>
                      </div>

                      {/* Vote button (voting phase only) */}
                      <ChallengeEntryVote
                        challengeId={params.id}
                        entryId={entry.id}
                        currentScore={entry.score}
                        isVoting={isVoting}
                      />

                      {/* Demo link */}
                      {entry.demoUrl && (
                        <a
                          href={entry.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost text-xs flex items-center gap-1 shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Demo
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {t.challenges.noEntries}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Sidebar ─── */}
        <div className="space-y-4">
          {/* Quick stats */}
          <div className="card">
            <h3 className="font-semibold mb-3">{t.challenges.information}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">{t.challenges.type}</span>
                <span className="font-medium">{getTypeLabel(challenge.type, t)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t.challenges.status}</span>
                <span className="font-medium" style={{ color: statusInfo.color }}>
                  {statusInfo.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t.challenges.start}</span>
                <span>{formatDate(challenge.startDate, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t.challenges.end}</span>
                <span>{formatDate(challenge.endDate, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t.challenges.participantsLabel}</span>
                <span className="font-bold text-primary-400">{challenge.entries.length}</span>
              </div>
              {challenge.prize && (
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.challenges.reward}</span>
                  <span className="font-bold text-accent-400">{challenge.prize}</span>
                </div>
              )}
            </div>
          </div>

          {/* Top 3 */}
          {rankedEntries.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Medal className="w-4 h-4 text-accent-400" />
                {t.challenges.ranking}
              </h3>
              <div className="space-y-2">
                {rankedEntries.slice(0, 5).map((entry, index) => {
                  const medalColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <span className="w-5 text-center text-xs font-bold">
                        {index < 3 ? (
                          <Trophy className={`w-3.5 h-3.5 mx-auto ${medalColors[index]}`} />
                        ) : (
                          <span className="text-gray-500">{index + 1}</span>
                        )}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {entry.user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm truncate flex-1">{entry.user.username}</span>
                      <span className="text-sm font-bold text-accent-400">{entry.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Participate CTA */}
          {isOpen && (
            <div className="card border-accent-500/20 bg-gradient-to-br from-accent-500/5 to-primary-500/5">
              <div className="text-center">
                <Trophy className="w-8 h-8 text-accent-400 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">{t.challenges.readyForChallenge}</h3>
                <p className="text-xs text-gray-400">
                  {t.challenges.createAndSubmit}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
