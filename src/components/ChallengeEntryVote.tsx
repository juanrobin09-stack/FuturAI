"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { useLanguage } from "@/i18n";
import toast from "react-hot-toast";

interface ChallengeEntryVoteProps {
  challengeId: string;
  entryId: string;
  currentScore: number;
  isVoting: boolean;
}

export default function ChallengeEntryVote({
  challengeId,
  entryId,
  currentScore,
  isVoting,
}: ChallengeEntryVoteProps) {
  const { t } = useLanguage();
  const [score, setScore] = useState(currentScore);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isVoting) return null;

  const handleVote = async () => {
    if (voted || loading) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/challenges/${challengeId}/entries/${entryId}/vote`,
        { method: "POST" }
      );

      if (res.ok) {
        setScore((prev) => prev + 1);
        setVoted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t.vote.error);
      }
    } catch {
      toast.error(t.vote.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={voted || loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        voted
          ? "bg-primary-500/20 text-primary-400 cursor-default"
          : "bg-gray-800 hover:bg-primary-500/15 text-gray-400 hover:text-primary-400"
      } disabled:opacity-60`}
      title={t.challengeVote.voteForEntry}
    >
      <ThumbsUp className={`w-3.5 h-3.5 ${voted ? "fill-current" : ""}`} />
      <span>{score}</span>
    </button>
  );
}
