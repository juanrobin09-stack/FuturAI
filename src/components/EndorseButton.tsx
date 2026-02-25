"use client";

import { useState } from "react";
import { ThumbsUp, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const SKILLS = ["ai", "code", "design", "research", "leadership"] as const;

const SKILL_LABELS: Record<string, { fr: string; en: string }> = {
  ai: { fr: "Intelligence Artificielle", en: "Artificial Intelligence" },
  code: { fr: "Developpement", en: "Development" },
  design: { fr: "Design", en: "Design" },
  research: { fr: "Recherche", en: "Research" },
  leadership: { fr: "Leadership", en: "Leadership" },
};

const SKILL_COLORS: Record<string, string> = {
  ai: "from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/20",
  code: "from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/20",
  design: "from-pink-500/20 to-pink-600/10 text-pink-400 border-pink-500/20",
  research: "from-green-500/20 to-green-600/10 text-green-400 border-green-500/20",
  leadership: "from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/20",
};

interface EndorseButtonProps {
  endorseeId: string;
  myEndorsements: string[];
  onEndorsementChange?: () => void;
}

export default function EndorseButton({ endorseeId, myEndorsements, onEndorsementChange }: EndorseButtonProps) {
  const { locale } = useLanguage();
  const [endorsed, setEndorsed] = useState<Set<string>>(new Set(myEndorsements));
  const [loading, setLoading] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const toggleEndorse = async (skill: string) => {
    setLoading(skill);
    try {
      const res = await fetch("/api/network/endorsements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endorseeId, skill }),
      });
      const data = await res.json();
      if (res.ok) {
        setEndorsed((prev) => {
          const next = new Set(prev);
          if (data.action === "added") {
            next.add(skill);
            toast.success(locale === "fr" ? "Recommandation ajoutee !" : "Endorsement added!");
          } else {
            next.delete(skill);
          }
          return next;
        });
        onEndorsementChange?.();
      } else {
        toast.error(data.error || "Error");
      }
    } catch {
      toast.error("Error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-500/15 text-accent-400 hover:bg-accent-500/25 transition-colors"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
        {locale === "fr" ? "Recommander" : "Endorse"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            className="absolute right-0 top-full mt-1 z-50 bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl p-2 min-w-[220px]"
          >
            {SKILLS.map((skill) => {
              const isEndorsed = endorsed.has(skill);
              const isLoading = loading === skill;
              return (
                <button
                  key={skill}
                  onClick={() => toggleEndorse(skill)}
                  disabled={isLoading}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all mb-0.5 ${
                    isEndorsed
                      ? `bg-gradient-to-r ${SKILL_COLORS[skill]} border`
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isEndorsed ? (
                    <ThumbsUp className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <ThumbsUp className="w-3.5 h-3.5" />
                  )}
                  {SKILL_LABELS[skill]?.[locale === "fr" ? "fr" : "en"] || skill}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { SKILLS, SKILL_LABELS, SKILL_COLORS };
