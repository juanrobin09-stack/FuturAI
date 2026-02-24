"use client";

import { useEffect, useState } from "react";
import IdeaCard from "@/components/IdeaCard";
import BadgeDisplay from "@/components/BadgeDisplay";
import {
  User, Lightbulb, Loader2, FolderKanban, GitBranch,
  Award, TrendingUp, Globe, MapPin, FlaskConical, Settings,
  Calendar, Pencil, Check, X, Camera, Github, Linkedin, Link2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useLanguage } from "@/i18n";
import PageTransition from "@/components/animations/PageTransition";

interface ImpactBreakdown {
  expertScore: number;
  contributionDepth: number;
  collaborationIndex: number;
  solutionMaturity: number;
  totalImpactScore: number;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  country: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  role: string;
  points: number;
  createdAt: string;
  globalRank: number;
  countryRank: number | null;
  sandboxSessionCount: number;
  impactBreakdown?: ImpactBreakdown;
  ideas: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    imageUrl: string | null;
    country: string | null;
    createdAt: string;
    score: number;
    author: { username: string; avatarUrl: string | null };
  }>;
  badges: Array<{
    badge: { name: string; description: string; icon: string };
  }>;
  contributions: Array<{
    id: string;
    type: string;
    description: string;
    pointsEarned: number;
    createdAt: string;
    project: { id: string; title: string } | null;
  }>;
  projects: Array<{
    role: string;
    project: { id: string; title: string; status: string };
  }>;
}

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isClerkAvailable = clerkKey.startsWith("pk_") && !clerkKey.includes("placeholder");

export default function ProfilePage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"projects" | "ideas" | "contributions" | "achievements">("projects");

  // Edit username/country state
  const [editingUsername, setEditingUsername] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editingCountry, setEditingCountry] = useState(false);
  const [editCountry, setEditCountry] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Bio editing state
  const [editingBio, setEditingBio] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  // Avatar editing state
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Social links editing state
  const [editingSocial, setEditingSocial] = useState(false);
  const [editGithub, setEditGithub] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [savingSocial, setSavingSocial] = useState(false);

  const saveUsername = async () => {
    if (!editUsername.trim() || savingProfile) return;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: editUsername.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((p) => p ? { ...p, username: data.user.username } : p);
        setEditingUsername(false);
        toast.success(t.profile.usernameSaved || "Username updated!");
      } else {
        toast.error(data.error || t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setSavingProfile(false);
    }
  };

  const saveCountry = async () => {
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: editCountry.trim() || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((p) => p ? { ...p, country: data.user.country } : p);
        setEditingCountry(false);
        toast.success(t.profile.countrySaved || "Country updated!");
      } else {
        toast.error(data.error || t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setSavingProfile(false);
    }
  };

  const saveBio = async () => {
    if (savingBio) return;
    setSavingBio(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: editBio.trim() || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((p) => p ? { ...p, bio: data.user.bio } : p);
        setEditingBio(false);
        toast.success(t.profile.bioSaved || "Bio updated!");
      } else {
        toast.error(data.error || t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setSavingBio(false);
    }
  };

  const saveAvatar = async () => {
    if (savingAvatar) return;
    setSavingAvatar(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: editAvatarUrl.trim() || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((p) => p ? { ...p, avatarUrl: data.user.avatarUrl } : p);
        setEditingAvatar(false);
        toast.success(t.profile.avatarSaved || "Photo updated!");
      } else {
        toast.error(data.error || t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setSavingAvatar(false);
    }
  };

  const saveSocialLinks = async () => {
    if (savingSocial) return;
    setSavingSocial(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUrl: editGithub.trim() || null,
          linkedinUrl: editLinkedin.trim() || null,
          websiteUrl: editWebsite.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((p) => p ? {
          ...p,
          githubUrl: data.user.githubUrl,
          linkedinUrl: data.user.linkedinUrl,
          websiteUrl: data.user.websiteUrl,
        } : p);
        setEditingSocial(false);
        toast.success(t.profile.socialSaved || "Links updated!");
      } else {
        toast.error(data.error || t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setSavingSocial(false);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const meRes = await fetch("/api/users/me");
        const meData = await meRes.json();
        const clerkId = meData?.user?.clerkId || "demo_clerk_id";

        const profileRes = await fetch(`/api/users?clerkId=${encodeURIComponent(clerkId)}`);
        const profileData = await profileRes.json();
        if (profileData && !profileData.error) {
          // Merge data from /api/users/me (which has bio, social links) into profile data
          setProfile({
            ...profileData,
            role: meData?.user?.role || "USER",
            bio: meData?.user?.bio || profileData.bio || null,
            avatarUrl: meData?.user?.avatarUrl || profileData.avatarUrl || null,
            githubUrl: meData?.user?.githubUrl || profileData.githubUrl || null,
            linkedinUrl: meData?.user?.linkedinUrl || profileData.linkedinUrl || null,
            websiteUrl: meData?.user?.websiteUrl || profileData.websiteUrl || null,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t.profile.title}</h1>
        <p className="text-gray-400 mb-4">
          {isClerkAvailable ? t.profile.signInPrompt : t.profile.demoMode}
        </p>
        <Link href="/ideas" className="btn-primary">{t.profile.exploreIdeas}</Link>
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  const hasSocialLinks = profile.githubUrl || profile.linkedinUrl || profile.websiteUrl;

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Profile header */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/10"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-3xl font-bold ring-2 ring-white/10">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => { setEditAvatarUrl(profile.avatarUrl || ""); setEditingAvatar(true); }}
                className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title={t.profile.editAvatar || "Change photo"}
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              {/* Editable Username */}
              {editingUsername ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="input-field text-lg font-bold px-2 py-1 w-48"
                    placeholder={t.profile.usernamePlaceholder || "Username"}
                    maxLength={30}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveUsername();
                      if (e.key === "Escape") setEditingUsername(false);
                    }}
                  />
                  <button
                    onClick={saveUsername}
                    disabled={savingProfile || !editUsername.trim()}
                    className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setEditingUsername(false)}
                    className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl font-bold">{profile.username}</h1>
                  <button
                    onClick={() => { setEditUsername(profile.username); setEditingUsername(true); }}
                    className="p-1 rounded text-gray-500 hover:text-primary-400 transition-colors"
                    title={t.profile.editUsername || "Edit username"}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Editable Country */}
              {editingCountry ? (
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <input
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="input-field text-sm px-2 py-0.5 w-40"
                    placeholder={t.profile.countryPlaceholder || "Country"}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveCountry();
                      if (e.key === "Escape") setEditingCountry(false);
                    }}
                  />
                  <button
                    onClick={saveCountry}
                    disabled={savingProfile}
                    className="p-1 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
                  >
                    {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setEditingCountry(false)}
                    className="p-1 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 justify-center sm:justify-start mt-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-sm">
                    {profile.country || (t.profile.noCountry || "No country set")}
                  </span>
                  <button
                    onClick={() => { setEditCountry(profile.country || ""); setEditingCountry(true); }}
                    className="p-0.5 rounded text-gray-500 hover:text-primary-400 transition-colors"
                    title={t.profile.editCountry || "Edit country"}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Bio */}
              {editingBio ? (
                <div className="mt-2">
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="input-field text-sm px-3 py-2 w-full resize-none"
                    placeholder={t.profile.bioPlaceholder || "Tell us about yourself..."}
                    rows={3}
                    maxLength={500}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingBio(false);
                    }}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{editBio.length}/500</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingBio(false)}
                        className="px-2 py-1 text-xs rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                      >
                        {t.common.cancel || "Cancel"}
                      </button>
                      <button
                        onClick={saveBio}
                        disabled={savingBio}
                        className="px-3 py-1 text-xs rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
                      >
                        {savingBio ? <Loader2 className="w-3 h-3 animate-spin inline" /> : (t.common.save || "Save")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-1 justify-center sm:justify-start mt-2">
                  <p className={`text-sm ${profile.bio ? "text-gray-300" : "text-gray-500 italic"}`}>
                    {profile.bio || (t.profile.noBio || "No bio")}
                  </p>
                  <button
                    onClick={() => { setEditBio(profile.bio || ""); setEditingBio(true); }}
                    className="p-0.5 rounded text-gray-500 hover:text-primary-400 transition-colors shrink-0 mt-0.5"
                    title={t.profile.editBio || "Edit bio"}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Social Links Display */}
              {!editingSocial && (
                <div className="flex items-center gap-3 justify-center sm:justify-start mt-3">
                  {profile.githubUrl && (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                      title="GitHub"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {profile.websiteUrl && (
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-accent-400 transition-colors"
                      title="Website"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setEditGithub(profile.githubUrl || "");
                      setEditLinkedin(profile.linkedinUrl || "");
                      setEditWebsite(profile.websiteUrl || "");
                      setEditingSocial(true);
                    }}
                    className="text-gray-500 hover:text-primary-400 transition-colors"
                    title={t.profile.socialLinks || "Links"}
                  >
                    {hasSocialLinks ? (
                      <Pencil className="w-3 h-3" />
                    ) : (
                      <span className="text-xs flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        {t.profile.socialLinks || "Links"}
                      </span>
                    )}
                  </button>
                </div>
              )}

              <p className="text-gray-500 text-xs flex items-center gap-1 justify-center sm:justify-start mt-2">
                <Calendar className="w-3 h-3" />
                {t.profile.memberSince} {memberSince}
              </p>
              {profile.role && profile.role !== "USER" && (
                <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
                  profile.role === "ADMIN"
                    ? "bg-accent-500/10 text-accent-400"
                    : profile.role === "EXPERT_INSTITUTION"
                    ? "bg-purple-500/10 text-purple-400"
                    : "bg-blue-500/10 text-blue-400"
                }`}>
                  {t.userRoles?.[profile.role as keyof typeof t.userRoles] || profile.role}
                </span>
              )}
              {!isClerkAvailable && (
                <span className="inline-block mt-2 ml-2 px-2 py-0.5 bg-accent-500/10 text-accent-400 text-xs rounded-full">
                  {t.common.demoMode}
                </span>
              )}
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <Settings className="w-4 h-4" />
              {t.profile.settings}
            </Link>
          </div>

          {/* Avatar URL editing inline */}
          {editingAvatar && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <label className="text-xs text-gray-400 mb-1 block">{t.profile.editAvatar || "Change photo"}</label>
              <div className="flex items-center gap-2">
                <input
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="input-field text-sm px-3 py-1.5 flex-1"
                  placeholder={t.profile.avatarUrlPlaceholder || "Photo URL (https://...)"}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveAvatar();
                    if (e.key === "Escape") setEditingAvatar(false);
                  }}
                />
                <button
                  onClick={saveAvatar}
                  disabled={savingAvatar}
                  className="px-3 py-1.5 text-xs rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
                >
                  {savingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setEditingAvatar(false)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Social links editing inline */}
          {editingSocial && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <label className="text-xs text-gray-400 mb-2 block">{t.profile.socialLinks || "Links"}</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    className="input-field text-sm px-3 py-1.5 flex-1"
                    placeholder={t.profile.githubPlaceholder || "https://github.com/username"}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveSocialLinks();
                      if (e.key === "Escape") setEditingSocial(false);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    className="input-field text-sm px-3 py-1.5 flex-1"
                    placeholder={t.profile.linkedinPlaceholder || "https://linkedin.com/in/username"}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveSocialLinks();
                      if (e.key === "Escape") setEditingSocial(false);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="input-field text-sm px-3 py-1.5 flex-1"
                    placeholder={t.profile.websitePlaceholder || "https://yoursite.com"}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveSocialLinks();
                      if (e.key === "Escape") setEditingSocial(false);
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  onClick={() => setEditingSocial(false)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                >
                  {t.common.cancel || "Cancel"}
                </button>
                <button
                  onClick={saveSocialLinks}
                  disabled={savingSocial}
                  className="px-4 py-1.5 text-xs rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
                >
                  {savingSocial ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : (t.common.save || "Save")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Performance Dashboard */}
        <h2 className="text-lg font-semibold mb-4">{t.profile.performanceDashboard}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <TrendingUp className="w-6 h-6 text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary-400">
              {profile.impactBreakdown?.totalImpactScore ?? profile.points}
            </div>
            <div className="text-xs text-gray-500 mt-1">{t.profile.impactScore}</div>
          </div>
          <div className="card text-center">
            <Globe className="w-6 h-6 text-accent-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-accent-400">#{profile.globalRank}</div>
            <div className="text-xs text-gray-500 mt-1">{t.profile.globalRank}</div>
          </div>
          <div className="card text-center">
            <MapPin className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-400">
              {profile.countryRank ? `#${profile.countryRank}` : "—"}
            </div>
            <div className="text-xs text-gray-500 mt-1">{t.profile.countryRank}</div>
          </div>
          <div className="card text-center">
            <FlaskConical className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-400">{profile.sandboxSessionCount}</div>
            <div className="text-xs text-gray-500 mt-1">{t.profile.arenaSessions}</div>
          </div>
        </div>

        {/* Impact Score Breakdown */}
        {profile.impactBreakdown && (
          <>
            <h2 className="text-lg font-semibold mb-4">{t.impactScore.title}</h2>
            <div className="card mb-8 space-y-3">
              {[
                { label: t.impactScore.expertScore, value: profile.impactBreakdown.expertScore, color: "bg-purple-500" },
                { label: t.impactScore.contributionDepth, value: profile.impactBreakdown.contributionDepth, color: "bg-primary-500" },
                { label: t.impactScore.collaborationIndex, value: profile.impactBreakdown.collaborationIndex, color: "bg-accent-500" },
                { label: t.impactScore.solutionMaturity, value: profile.impactBreakdown.solutionMaturity, color: "bg-emerald-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-40 text-right shrink-0">{item.label}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full flex items-center justify-end pr-2 transition-all`}
                      style={{ width: `${Math.max(item.value, 4)}%` }}
                    >
                      <span className="text-xs font-medium text-white">{item.value}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-10">{t.impactScore.outOf}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Contribution Breakdown */}
        <h2 className="text-lg font-semibold mb-4">{t.profile.contributionBreakdown}</h2>
        <div className="card mb-8">
          <div className="space-y-3">
            {[
              { label: t.profile.tabProjects, count: profile.projects?.length || 0, color: "bg-primary-500" },
              { label: t.profile.tabIdeas, count: profile.ideas.length, color: "bg-accent-500" },
              { label: t.profile.tabContributions, count: profile.contributions?.length || 0, color: "bg-purple-500" },
              { label: t.profile.tabAchievements, count: profile.badges.length, color: "bg-emerald-500" },
              { label: t.profile.arenaSessions, count: profile.sandboxSessionCount, color: "bg-amber-500" },
            ].map((item) => {
              const maxCount = Math.max(
                profile.projects?.length || 0,
                profile.ideas.length,
                profile.contributions?.length || 0,
                profile.badges.length,
                profile.sandboxSessionCount,
                1
              );
              const widthPercent = Math.max((item.count / maxCount) * 100, 4);
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-28 text-right shrink-0">{item.label}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full flex items-center justify-end pr-2 transition-all`}
                      style={{ width: `${widthPercent}%` }}
                    >
                      <span className="text-xs font-medium text-white">{item.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges */}
        {profile.badges.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-lg font-semibold mb-3">{t.profile.tabAchievements}</h2>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((ub, i) => (
                <BadgeDisplay key={i} badge={ub.badge} />
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { key: "projects" as const, label: t.profile.tabProjects, icon: FolderKanban },
            { key: "ideas" as const, label: t.profile.tabIdeas, icon: Lightbulb },
            { key: "contributions" as const, label: t.profile.tabContributions, icon: GitBranch },
            { key: "achievements" as const, label: t.profile.tabAchievements, icon: Award },
          ].map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === tabItem.key
                  ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                  : "text-gray-400 hover:bg-white/5 border border-transparent"
              }`}
            >
              <tabItem.icon className="w-4 h-4" />
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* Projects tab */}
        {tab === "projects" && (
          <div className="space-y-3">
            {profile.projects?.length > 0 ? (
              profile.projects.map((pm, i) => (
                <Link key={i} href={`/projects/${pm.project.id}`} className="card flex items-center gap-4 hover:border-primary-500/20">
                  <FolderKanban className="w-5 h-5 text-primary-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{pm.project.title}</span>
                    <span className="text-xs text-gray-500 ml-2">({t.roles[pm.role as keyof typeof t.roles] || pm.role})</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                    {t.statuses[pm.project.status as keyof typeof t.statuses] || pm.project.status}
                  </span>
                </Link>
              ))
            ) : (
              <div className="card text-center py-12">
                <FolderKanban className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">{t.profile.noProject}</p>
                <Link href="/projects" className="btn-accent mt-4 inline-flex items-center gap-2 text-sm">
                  {t.profile.joinProject}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Ideas tab */}
        {tab === "ideas" && (
          <div className="space-y-4">
            {profile.ideas.length > 0 ? (
              profile.ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
            ) : (
              <div className="card text-center py-12">
                <Lightbulb className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">{t.profile.noIdea}</p>
                <Link href="/ideas/submit" className="btn-accent mt-4 inline-flex items-center gap-2 text-sm">
                  {t.profile.submitIdea}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Contributions tab */}
        {tab === "contributions" && (
          <div className="space-y-2">
            {profile.contributions?.length > 0 ? (
              profile.contributions.map((c) => (
                <div key={c.id} className="card flex items-center gap-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-accent-500/10 text-accent-400 shrink-0">
                    {t.contributionTypes[c.type as keyof typeof t.contributionTypes] || c.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-1">{c.description}</p>
                    {c.project && (
                      <Link href={`/projects/${c.project.id}`} className="text-xs text-primary-400 hover:underline">
                        {c.project.title}
                      </Link>
                    )}
                  </div>
                  <span className="text-xs text-accent-300 font-medium shrink-0">+{c.pointsEarned} {t.common.pts}</span>
                </div>
              ))
            ) : (
              <div className="card text-center py-12">
                <GitBranch className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">{t.profile.noContribution}</p>
              </div>
            )}
          </div>
        )}

        {/* Achievements tab */}
        {tab === "achievements" && (
          <div className="space-y-3">
            {profile.badges.length > 0 ? (
              profile.badges.map((ub, i) => (
                <div key={i} className="card flex items-center gap-4 py-3">
                  <BadgeDisplay badge={ub.badge} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{ub.badge.name}</p>
                    <p className="text-xs text-gray-500">{ub.badge.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="card text-center py-12">
                <Award className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">{t.profile.noBadge}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
