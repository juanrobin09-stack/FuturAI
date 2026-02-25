"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, getCategoryLabel } from "@/lib/utils";
import { Send, Loader2, FolderKanban, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useLanguage } from "@/i18n";
import PageTransition from "@/components/animations/PageTransition";

export default function CreateProjectPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    country: "",
    problemAddressed: "",
    challengeId: "",
    // V7 Impact Assessment
    problemSeverity: "",
    populationAffected: "",
    geographicScope: "",
    implementationReadiness: "",
    scalabilityPotential: "",
    verificationMethod: "",
  });
  const [challenges, setChallenges] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    fetch("/api/challenges?status=open")
      .then((r) => r.json())
      .then((data) => setChallenges(data.challenges || []))
      .catch(() => {});
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.category) {
      toast.error(t.projectForm.requiredFields);
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            status: "open",
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || t.common.error);
        }

        const project = await res.json();
        toast.success(t.projectForm.successMessage);
        router.push(`/projects/${project.id}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t.projectForm.errorMessage;
        toast.error(message);
      }
    });
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Back link */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.projectForm.backToProjects}
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold">
            {t.projectForm.pageTitle}{" "}
            <span className="gradient-text">{t.projectForm.pageTitleHighlight}</span>
          </h1>
          <p className="text-gray-400 mt-2">{t.projectForm.pageSubtitle}</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.projectForm.nameLabel} <span className="text-red-400">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder={t.projectForm.namePlaceholder}
                className="input-field"
                maxLength={120}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.projectForm.descriptionLabel} <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={t.projectForm.descriptionPlaceholder}
                className="input-field min-h-[160px] resize-y"
                maxLength={5000}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {form.description.length}/5000 {t.common.characters}
              </p>
            </div>

            {/* Impact Area + Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t.projectForm.impactLabel} <span className="text-red-400">*</span>
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">{t.projectForm.impactPlaceholder}</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {getCategoryLabel(cat.value, t.categories)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t.projectForm.countryLabel}
                </label>
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder={t.projectForm.countryPlaceholder}
                  className="input-field"
                />
              </div>
            </div>

            {/* Problem Addressed */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.projectForm.problemLabel}
              </label>
              <textarea
                name="problemAddressed"
                value={form.problemAddressed}
                onChange={handleChange}
                placeholder={t.projectForm.problemPlaceholder}
                className="input-field min-h-[80px] resize-y"
                maxLength={2000}
              />
            </div>

            {/* Challenge Link */}
            {challenges.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t.projectForm.challengeLabel}
                </label>
                <select
                  name="challengeId"
                  value={form.challengeId}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">{t.projectForm.challengePlaceholder}</option>
                  {challenges.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* V7: Impact Assessment */}
            <div className="border-t border-white/5 pt-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                📊 {locale === "fr" ? "\u00c9valuation d\u2019Impact (optionnel)" : "Impact Assessment (optional)"}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    {locale === "fr" ? "S\u00e9v\u00e9rit\u00e9 du probl\u00e8me (1-10)" : "Problem Severity (1-10)"}
                  </label>
                  <select name="problemSeverity" value={form.problemSeverity} onChange={handleChange} className="input-field text-sm">
                    <option value="">--</option>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    {locale === "fr" ? "Port\u00e9e g\u00e9ographique" : "Geographic Scope"}
                  </label>
                  <select name="geographicScope" value={form.geographicScope} onChange={handleChange} className="input-field text-sm">
                    <option value="">--</option>
                    <option value="local">{locale === "fr" ? "Local" : "Local"}</option>
                    <option value="regional">{locale === "fr" ? "R\u00e9gional" : "Regional"}</option>
                    <option value="national">{locale === "fr" ? "National" : "National"}</option>
                    <option value="continental">{locale === "fr" ? "Continental" : "Continental"}</option>
                    <option value="global">{locale === "fr" ? "Global" : "Global"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    {locale === "fr" ? "Niveau IRL (1-9)" : "IRL Level (1-9)"}
                  </label>
                  <select name="implementationReadiness" value={form.implementationReadiness} onChange={handleChange} className="input-field text-sm">
                    <option value="">--</option>
                    {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    {locale === "fr" ? "Scalabilit\u00e9 (1-5)" : "Scalability (1-5)"}
                  </label>
                  <select name="scalabilityPotential" value={form.scalabilityPotential} onChange={handleChange} className="input-field text-sm">
                    <option value="">--</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  {locale === "fr" ? "Population affect\u00e9e (estimation)" : "Population Affected (estimate)"}
                </label>
                <input
                  name="populationAffected"
                  value={form.populationAffected}
                  onChange={handleChange}
                  placeholder={locale === "fr" ? "Ex: 50 000 agriculteurs en Afrique sub-saharienne" : "e.g. 50,000 farmers in Sub-Saharan Africa"}
                  className="input-field text-sm"
                />
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  {locale === "fr" ? "M\u00e9thode de v\u00e9rification" : "Verification Method"}
                </label>
                <input
                  name="verificationMethod"
                  value={form.verificationMethod}
                  onChange={handleChange}
                  placeholder={locale === "fr" ? "Comment mesurer l'impact ?" : "How will impact be measured?"}
                  className="input-field text-sm"
                />
              </div>
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
              {isPending ? t.projectForm.submitting : t.projectForm.submitButton}
            </button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
