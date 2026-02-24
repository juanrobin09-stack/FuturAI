"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";

interface VersionFormProps {
  projectId: string;
}

export default function VersionForm({ projectId }: VersionFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || !changelog.trim() || loading) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: version.trim(),
          changelog: changelog.trim(),
        }),
      });

      if (res.ok) {
        setVersion("");
        setChangelog("");
        setShow(false);
        router.refresh();
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
      >
        {show ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {t.versions.addVersion}
      </button>

      <AnimatePresence>
        {show && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="mt-3 space-y-3 overflow-hidden"
          >
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1.5">
                <GitBranch className="w-3 h-3" />
                {t.versions.versionNumber}
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder={t.versions.versionPlaceholder}
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">
                {t.versions.changelog}
              </label>
              <textarea
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder={t.versions.changelogPlaceholder}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !version.trim() || !changelog.trim()}
              className="btn-primary text-sm w-full disabled:opacity-50"
            >
              {loading ? t.versions.adding : t.versions.addVersion}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
