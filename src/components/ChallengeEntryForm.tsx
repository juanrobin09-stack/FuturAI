"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Send, Link2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";

interface UserProject {
  id: string;
  title: string;
}

interface ChallengeEntryFormProps {
  challengeId: string;
  userProjects: UserProject[];
}

export default function ChallengeEntryForm({ challengeId, userProjects }: ChallengeEntryFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/challenges/${challengeId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          projectId: projectId || undefined,
          demoUrl: demoUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          setError(t.challengeEntry.alreadySubmitted);
        } else {
          setError(data.error || t.common.error);
        }
        setLoading(false);
        return;
      }

      // Success
      setDescription("");
      setProjectId("");
      setDemoUrl("");
      setShow(false);
      router.refresh();
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setShow(!show)}
        className="btn-accent w-full flex items-center justify-center gap-2 text-base"
      >
        {show ? <ChevronUp className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        {t.challengeEntry.submitEntry}
      </button>

      <AnimatePresence>
        {show && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="mt-4 card overflow-hidden"
          >
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Description */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent-400" />
                {t.challengeEntry.description}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.challengeEntry.descriptionPlaceholder}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/25 resize-none"
                required
              />
            </div>

            {/* Project link (optional) */}
            {userProjects.length > 0 && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary-400" />
                  {t.challengeEntry.linkProject}
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25"
                >
                  <option value="">{t.challengeEntry.selectProject}</option>
                  {userProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Demo URL (optional) */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary-400" />
                {t.challengeEntry.demoUrl}
              </label>
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder={t.challengeEntry.demoUrlPlaceholder}
                className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !description.trim()}
              className="btn-accent w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {loading ? t.challengeEntry.submitting : t.challengeEntry.submitEntry}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
