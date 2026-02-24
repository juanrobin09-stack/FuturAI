"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n";
import toast from "react-hot-toast";

interface VoteButtonProps {
  ideaId: string;
  initialScore: number;
  initialUserVote?: number;
  size?: "sm" | "md" | "lg";
}

export default function VoteButton({
  ideaId,
  initialScore,
  initialUserVote = 0,
  size = "md",
}: VoteButtonProps) {
  const { t } = useLanguage();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isPending, startTransition] = useTransition();

  const handleVote = (value: number) => {
    const newVote = userVote === value ? 0 : value;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/ideas/${ideaId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: newVote }),
        });

        if (!res.ok) throw new Error("Vote failed");

        const data = await res.json();
        setScore(data.score);
        setUserVote(newVote);
      } catch {
        toast.error(t.vote.error);
      }
    });
  };

  const sizeClasses = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-1.5",
  };

  const iconSize = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className={`flex flex-col items-center ${sizeClasses[size]}`}>
      <motion.button
        onClick={() => handleVote(1)}
        disabled={isPending}
        whileTap={{ scale: 0.85 }}
        className={`p-1 rounded-lg transition-all hover:bg-white/10 ${
          userVote === 1
            ? "text-primary-400 bg-primary-400/10"
            : "text-gray-500 hover:text-primary-400"
        }`}
      >
        <ChevronUp className={iconSize[size]} />
      </motion.button>
      <span
        className={`font-bold tabular-nums ${
          score > 0
            ? "text-primary-400"
            : score < 0
            ? "text-red-400"
            : "text-gray-400"
        } ${size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm"}`}
      >
        {score}
      </span>
      <motion.button
        onClick={() => handleVote(-1)}
        disabled={isPending}
        whileTap={{ scale: 0.85 }}
        className={`p-1 rounded-lg transition-all hover:bg-white/10 ${
          userVote === -1
            ? "text-red-400 bg-red-400/10"
            : "text-gray-500 hover:text-red-400"
        }`}
      >
        <ChevronDown className={iconSize[size]} />
      </motion.button>
    </div>
  );
}
