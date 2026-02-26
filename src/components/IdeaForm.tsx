"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, getCategoryLabel } from "@/lib/utils";
import { Send, ImagePlus, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n";
import toast from "react-hot-toast";

export default function IdeaForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    country: "",
    imageUrl: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.category) {
      toast.error(t.ideaForm.requiredFields);
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || t.common.error);
        }

        const idea = await res.json();
        toast.success(t.ideaForm.successMessage);
        router.push(`/ideas/${idea.id}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t.ideaForm.errorMessage;
        toast.error(message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t.ideaForm.titleLabel} <span className="text-red-400">*</span>
        </label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder={t.ideaForm.titlePlaceholder}
          className="input-field"
          maxLength={120}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t.ideaForm.descriptionLabel} <span className="text-red-400">*</span>
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder={t.ideaForm.descriptionPlaceholder}
          className="input-field min-h-[160px] resize-y"
          maxLength={5000}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {form.description.length}/5000 {t.common.characters}
        </p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t.ideaForm.categoryLabel} <span className="text-red-400">*</span>
        </label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="">{t.ideaForm.categoryPlaceholder}</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {getCategoryLabel(cat.value, t.categories)}
            </option>
          ))}
        </select>
      </div>

      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t.ideaForm.countryLabel}
        </label>
        <input
          name="country"
          value={form.country}
          onChange={handleChange}
          placeholder={t.ideaForm.countryPlaceholder}
          className="input-field"
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <ImagePlus className="w-4 h-4 inline mr-1" />
          {t.ideaForm.imageLabel}
        </label>
        <input
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="input-field"
          type="url"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="btn-accent w-full flex items-center justify-center gap-2 text-base"
      >
        {isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
        {isPending ? t.ideaForm.submitting : t.ideaForm.submitButton}
      </button>
    </form>
  );
}
