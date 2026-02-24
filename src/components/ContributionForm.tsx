"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Code, Palette, Search, FlaskConical, MessageSquare } from "lucide-react";
import { CONTRIBUTION_TYPES } from "@/lib/utils";
import { useLanguage } from "@/i18n";
import toast from "react-hot-toast";

const typeIcons: Record<string, React.ElementType> = {
  code: Code,
  design: Palette,
  research: Search,
  testing: FlaskConical,
  feedback: MessageSquare,
};

interface ContributionFormProps {
  projectId: string;
  onAdded?: () => void;
}

export default function ContributionForm({ projectId, onAdded }: ContributionFormProps) {
  const { t } = useLanguage();
  const [type, setType] = useState("code");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [show, setShow] = useState(false);

  const handleSubmit = () => {
    if (!description.trim()) {
      toast.error(t.contribution.describeError);
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/contributions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, description: description.trim() }),
        });
        if (!res.ok) throw new Error();
        setDescription("");
        setShow(false);
        toast.success(t.contribution.successMessage);
        onAdded?.();
      } catch {
        toast.error(t.contribution.errorMessage);
      }
    });
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="btn-accent flex items-center gap-2 w-full justify-center"
      >
        <Plus className="w-4 h-4" />
        {t.contribution.addContribution}
      </button>
    );
  }

  return (
    <div className="card space-y-4 border-accent-500/20">
      <h4 className="font-semibold text-sm">{t.contribution.newContribution}</h4>

      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {CONTRIBUTION_TYPES.map((ct) => {
          const Icon = typeIcons[ct.value] || Code;
          return (
            <button
              key={ct.value}
              onClick={() => setType(ct.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                type === ct.value
                  ? "bg-accent-500/20 text-accent-400 border border-accent-500/30"
                  : "text-gray-400 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className="w-3 h-3" />
              {t.contributionTypes[ct.value] || ct.value}
            </button>
          );
        })}
      </div>

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t.contribution.describePlaceholder}
        className="input-field min-h-[80px] resize-y text-sm"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="btn-accent flex-1 flex items-center justify-center gap-2 text-sm"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {t.contribution.submit}
        </button>
        <button onClick={() => setShow(false)} className="btn-ghost text-sm">
          {t.contribution.cancel}
        </button>
      </div>
    </div>
  );
}
