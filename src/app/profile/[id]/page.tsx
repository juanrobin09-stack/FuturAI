"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Star,
  Trophy,
  Loader2,
  MapPin,
  Calendar,
  ExternalLink,
  Flame,
  FolderKanban,
  UserPlus,
  Check,
  Clock,
  ThumbsUp,
  Award,
} from "lucide-react";
import { getLevelFromPoints } from "@/lib/points";
import { useLanguage } from "@/i18n";
import PageTransition from "@/components/animations/PageTransition";
import FadeIn from "@/components/animations/FadeIn";
import EndorseButton from "@/components/EndorseButton";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { SKILL_LABELS, SKILL_COLORS } from "@/components/EndorseButton";

interface ProfileData {
  user: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    country?: string | null;
    bio?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    websiteUrl?: string | null;
    points: number;
    role: string;
    verified: boolean;
    createdAt: string;
    connectionsCount: number;
    totalEndorsements: number;
    _count: { ideas: number; contributions: number; badges: number };
    projects: { id: string; title: string; category: string; status: string }[];
    badges: { id: string; name: string; description: string; icon: string; category: string }[];
    endorsements: Record<string, { count: number; endorsers: { id: string; username: string; avatarUrl: string | null }[] }>;
  };
  connectionStatus: "none" | "pending_sent" | "pending_received" | "connected" | "self";
  connectionId: string | null;
  mutualConnections: number;
  myEndorsements: string[];
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { t, locale } = useLanguage();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<string>("none");
  const [connLoading, setConnLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/profile/${id}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setConnStatus(d.connectionStatus);
      }
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleConnect = async () => {
    setConnLoading(true);
    try {
      const res = await fetch("/api/network/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: id }),
      });
      if (res.ok) {
        setConnStatus("pending_sent");
        toast.success(t.network?.requestSent || "Connection request sent!");
      }
    } catch {}
    setConnLoading(false);
  };

  const handleAccept = async () => {
    if (!data?.connectionId) return;
    setConnLoading(true);
    try {
      const res = await fetch(`/api/network/connections/${data.connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (res.ok) {
        setConnStatus("connected");
        toast.success(t.network?.connectionAccepted || "Connected!");
        fetchProfile();
      }
    } catch {}
    setConnLoading(false);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      </PageTransition>
    );
  }

  if (!data) {
    return (
      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-400">{locale === "fr" ? "Utilisateur non trouv\u00e9" : "User not found"}</h2>
        </div>
      </PageTransition>
    );
  }

  const { user, mutualConnections, myEndorsements } = data;
  const { level, title } = getLevelFromPoints(user.points, t.levels);

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <FadeIn>
          {/* Header Card */}
          <div className="card relative overflow-hidden">
            {/* Gradient banner */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary-500/20 via-accent-500/20 to-purple-500/20" />

            <div className="relative pt-12 pb-2 px-2">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white border-4 border-[#1a1a2e] -mt-6">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h1 className="text-xl font-bold">{user.username}</h1>
                    {user.verified && (
                      <span className="text-primary-400" title="Verified">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-400">
                      {t.common.level} {level} — {title}
                    </span>
                    {user.country && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {user.country}
                      </span>
                    )}
                  </div>
                  {user.bio && (
                    <p className="text-sm text-gray-400 mt-2">{user.bio}</p>
                  )}
                </div>

                {/* Connection button */}
                {connStatus !== "self" && (
                  <div className="shrink-0">
                    {connLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
                    ) : connStatus === "none" ? (
                      <button onClick={handleConnect} className="btn-primary flex items-center gap-2 text-sm">
                        <UserPlus className="w-4 h-4" />
                        {t.network?.connect || "Connect"}
                      </button>
                    ) : connStatus === "pending_sent" ? (
                      <span className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-500 bg-white/5">
                        <Clock className="w-4 h-4" />
                        {t.network?.pending || "Pending"}
                      </span>
                    ) : connStatus === "pending_received" ? (
                      <button onClick={handleAccept} className="btn-primary flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4" />
                        {t.network?.accept || "Accept"}
                      </button>
                    ) : connStatus === "connected" ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-green-400 bg-green-500/10">
                          <Check className="w-4 h-4" />
                          {t.network?.connected || "Connected"}
                        </span>
                        <EndorseButton
                          endorseeId={user.id}
                          myEndorsements={myEndorsements}
                          onEndorsementChange={fetchProfile}
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Links */}
              {(user.githubUrl || user.linkedinUrl || user.websiteUrl) && (
                <div className="flex items-center gap-3 mt-4 justify-center sm:justify-start">
                  {user.githubUrl && (
                    <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> GitHub
                    </a>
                  )}
                  {user.linkedinUrl && (
                    <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> LinkedIn
                    </a>
                  )}
                  {user.websiteUrl && (
                    <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            {[
              { icon: Flame, label: t.common.points, value: user.points, color: "text-accent-400" },
              { icon: Users, label: t.network?.connections || "Connections", value: user.connectionsCount, color: "text-primary-400" },
              { icon: FolderKanban, label: locale === "fr" ? "Projets" : "Projects", value: user.projects.length, color: "text-blue-400" },
              { icon: Trophy, label: "Badges", value: user.badges.length, color: "text-yellow-400" },
              { icon: ThumbsUp, label: t.network?.endorsements || "Endorsements", value: user.totalEndorsements, color: "text-purple-400" },
            ].map((stat) => (
              <div key={stat.label} className="card text-center py-3">
                <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-[10px] text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {mutualConnections > 0 && connStatus !== "self" && (
            <p className="text-xs text-primary-400 mt-2 text-center">
              {mutualConnections} {t.network?.mutualConnections || "mutual connections"}
            </p>
          )}

          {/* Endorsements */}
          {Object.keys(user.endorsements).length > 0 && (
            <div className="card mt-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <ThumbsUp className="w-4 h-4 text-accent-400" />
                {t.network?.endorsements || "Endorsements"}
              </h3>
              <div className="space-y-2">
                {Object.entries(user.endorsements)
                  .filter(([, data]) => data.count > 0)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .map(([skill, data]) => (
                    <div key={skill} className="flex items-center gap-3">
                      <span className={`text-xs font-medium min-w-[100px] px-2 py-1 rounded-md bg-gradient-to-r ${SKILL_COLORS[skill] || ""} border`}>
                        {SKILL_LABELS[skill]?.[locale === "fr" ? "fr" : "en"] || skill}
                      </span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(data.count * 10, 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-gray-500 min-w-[20px] text-right">{data.count}</span>
                      <div className="flex -space-x-1">
                        {data.endorsers.slice(0, 3).map((e) => (
                          <div key={e.id} className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[8px] font-bold text-white border border-[#1a1a2e]" title={e.username}>
                            {e.username.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {user.projects.length > 0 && (
            <div className="card mt-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <FolderKanban className="w-4 h-4 text-blue-400" />
                {locale === "fr" ? "Projets" : "Projects"}
              </h3>
              <div className="space-y-2">
                {user.projects.map((p) => (
                  <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <FolderKanban className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{p.title}</span>
                      <span className="text-[10px] text-gray-500 ml-2">{p.category}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      p.status === "completed" ? "bg-green-500/15 text-green-400" :
                      p.status === "in_progress" ? "bg-blue-500/15 text-blue-400" :
                      "bg-gray-500/15 text-gray-400"
                    }`}>
                      {p.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {user.badges.length > 0 && (
            <div className="card mt-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-yellow-400" />
                Badges
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {user.badges.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <Trophy className="w-4 h-4 text-accent-400" />
                    <div>
                      <span className="text-xs font-medium">{b.name}</span>
                      <p className="text-[10px] text-gray-500">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Member since */}
          <div className="text-center mt-6">
            <span className="text-[10px] text-gray-600 flex items-center gap-1 justify-center">
              <Calendar className="w-3 h-3" />
              {locale === "fr" ? "Membre depuis" : "Member since"} {new Date(user.createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { year: "numeric", month: "long" })}
            </span>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
