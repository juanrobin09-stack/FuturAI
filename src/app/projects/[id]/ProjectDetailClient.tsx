"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
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
  const { t } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      {/* Join project button */}
      <button
        onClick={handleJoin}
        disabled={joining}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {joining ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        {joining ? t.projects.joining : t.projects.joinProject}
      </button>

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

      {/* Sandbox AI */}
      <SandboxAI ideaId={projectId} ideaTitle={projectTitle} />
    </div>
  );
}
