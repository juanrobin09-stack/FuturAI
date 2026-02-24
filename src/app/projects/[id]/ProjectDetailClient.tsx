"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Loader2, FlaskConical, Code, Eye, ArrowRight } from "lucide-react";
import ContributionForm from "@/components/ContributionForm";
import CommentThread from "@/components/CommentThread";
import SandboxAI from "@/components/SandboxAI";
import VersionForm from "@/components/VersionForm";
import toast from "react-hot-toast";
import { useLanguage } from "@/i18n";

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  user: { username: string; avatarUrl?: string | null };
  replies?: CommentData[];
}

interface ProjectDetailClientProps {
  projectId: string;
  projectTitle: string;
  comments: CommentData[];
}

export default function ProjectDetailClient({
  projectId,
  projectTitle,
  comments,
}: ProjectDetailClientProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [joining, setJoining] = useState(false);
  const [joinRole, setJoinRole] = useState<"contributor" | "tester">("contributor");

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: joinRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t.common.error);
      }

      toast.success(t.projects.joinedSuccess);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.common.error;
      toast.error(message);
    } finally {
      setJoining(false);
    }
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Action buttons: Join + Arena */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Join project */}
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary-400" />
            {t.projects.joinProject}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setJoinRole("contributor")}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                joinRole === "contributor"
                  ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                  : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"
              }`}
            >
              <Code className="w-3.5 h-3.5 inline mr-1" />
              {locale === "fr" ? "Contributeur" : "Contributor"}
            </button>
            <button
              onClick={() => setJoinRole("tester")}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                joinRole === "tester"
                  ? "bg-accent-500/20 text-accent-400 border border-accent-500/30"
                  : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              {locale === "fr" ? "Testeur" : "Tester"}
            </button>
          </div>
          <button
            onClick={handleJoin}
            disabled={joining}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
          >
            {joining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {joining
              ? (locale === "fr" ? "Inscription..." : "Joining...")
              : t.projects.joinProject}
          </button>
        </div>

        {/* Open in Arena */}
        <Link
          href="/arena"
          className="card p-4 group hover:border-accent-500/30 transition-all flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <FlaskConical className="w-4 h-4 text-accent-400" />
              {locale === "fr" ? "Ouvrir dans l'Arena" : "Open in Arena"}
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              {locale === "fr"
                ? "Generez du code, des images et des prototypes avec l'IA. Connectez votre cle API pour commencer."
                : "Generate code, images and prototypes with AI. Connect your API key to get started."}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">Code IA</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-400 border border-accent-500/20">Images</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Video</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-accent-400 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Contribution form */}
      <ContributionForm projectId={projectId} onAdded={handleRefresh} />

      {/* Version form */}
      <VersionForm projectId={projectId} />

      {/* Comments */}
      <CommentThread
        projectId={projectId}
        comments={comments}
        onCommentAdded={handleRefresh}
      />

      {/* Sandbox AI (inline quick generate) */}
      <SandboxAI ideaId={projectId} ideaTitle={projectTitle} />
    </div>
  );
}
