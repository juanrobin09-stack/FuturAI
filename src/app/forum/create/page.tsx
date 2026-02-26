"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n";
import PageTransition from "@/components/animations/PageTransition";
import { FORUM_CATEGORIES } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ForumCreatePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error(t.forum.requiredFields);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category: category || "general",
          content: content.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to create thread");

      const data = await res.json();
      toast.success(t.forum.successMessage);
      router.push(`/forum/${data.id}`);
    } catch {
      toast.error(t.forum.errorMessage);
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Back link */}
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.forum.backToForum}
        </Link>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Lancer une{" "}
            <span className="gradient-text">discussion</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">{t.forum.subtitle}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-4 sm:space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.forum.threadTitle}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.forum.threadTitlePlaceholder}
              className="input-field"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.forum.threadCategory}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
            >
              <option value="">-- {t.forum.allCategories} --</option>
              {FORUM_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {t.forumCategories[cat.value] || cat.value}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.forum.threadContent}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.forum.threadContentPlaceholder}
              className="input-field min-h-[120px] sm:min-h-[200px] resize-y"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.forum.creating}
              </>
            ) : (
              t.forum.createButton
            )}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}
