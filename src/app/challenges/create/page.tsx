"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { useLanguage } from "@/i18n";
import { CHALLENGE_CATEGORIES } from "@/lib/utils";
import PageTransition from "@/components/animations/PageTransition";

export default function CreateChallengePage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    type: "weekly",
    prize: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    measurableGoal: "",
    evaluationCriteria: "",
    impactArea: "",
    sdgAlignment: "",
    context: "",
    // V7 fields
    measurableOutcome: "",
    geographicScope: "",
    estimatedBudget: "",
    implementationPartnerNeeded: false,
    verificationMethod: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.endDate) {
      setError(t.challengeForm.requiredFields);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      router.push("/challenges");
    } catch {
      setError(t.challengeForm.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = CHALLENGE_CATEGORIES.map((c) => ({
    value: c.value,
    label: t.challengeCategories[c.value] || c.value,
  }));

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/challenges"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.challenges.backToChallenges}
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-accent-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {t.challengeForm.pageTitle}{" "}
              <span className="gradient-text">{t.challengeForm.pageTitleHighlight}</span>
            </h1>
            <p className="text-gray-400 mt-0.5">{t.challengeForm.pageSubtitle}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{t.challengeForm.titleLabel} *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t.challengeForm.titlePlaceholder}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{t.challengeForm.descriptionLabel} *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t.challengeForm.descriptionPlaceholder}
              rows={4}
              className="input-field resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t.challengeForm.impactAreaLabel}</label>
              <select
                value={form.impactArea}
                onChange={(e) => setForm({ ...form, impactArea: e.target.value })}
                className="input-field"
              >
                <option value="">{t.challengeForm.impactAreaPlaceholder}</option>
                {categoryOptions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t.challengeForm.typeLabel}</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input-field"
              >
                <option value="weekly">{t.challenges.typeWeekly}</option>
                <option value="monthly">{t.challenges.typeMonthly}</option>
                <option value="special">{t.challenges.typeSpecial}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{t.challengeForm.contextLabel}</label>
            <textarea
              value={form.context}
              onChange={(e) => setForm({ ...form, context: e.target.value })}
              placeholder={t.challengeForm.contextPlaceholder}
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{t.challengeForm.measurableGoalLabel}</label>
            <textarea
              value={form.measurableGoal}
              onChange={(e) => setForm({ ...form, measurableGoal: e.target.value })}
              placeholder={t.challengeForm.measurableGoalPlaceholder}
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{t.challengeForm.evaluationCriteriaLabel}</label>
            <textarea
              value={form.evaluationCriteria}
              onChange={(e) => setForm({ ...form, evaluationCriteria: e.target.value })}
              placeholder={t.challengeForm.evaluationCriteriaPlaceholder}
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t.challengeForm.prizeLabel}</label>
              <input
                value={form.prize}
                onChange={(e) => setForm({ ...form, prize: e.target.value })}
                placeholder={t.challengeForm.prizePlaceholder}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t.challengeForm.sdgAlignmentLabel}</label>
              <input
                value={form.sdgAlignment}
                onChange={(e) => setForm({ ...form, sdgAlignment: e.target.value })}
                placeholder={t.challengeForm.sdgAlignmentPlaceholder}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t.challengeForm.startDateLabel}</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t.challengeForm.endDateLabel} *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* V7: Enhanced Fields */}
          <div className="border-t border-white/5 pt-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">
              {locale === "fr" ? "Cadre d'Impact V7" : "V7 Impact Framework"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {locale === "fr" ? "R\u00e9sultat mesurable" : "Measurable Outcome"}
                </label>
                <textarea
                  value={form.measurableOutcome}
                  onChange={(e) => setForm({ ...form, measurableOutcome: e.target.value })}
                  placeholder={locale === "fr" ? "Quel r\u00e9sultat concret et mesurable est attendu ?" : "What concrete, measurable outcome is expected?"}
                  rows={2}
                  className="input-field resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    {locale === "fr" ? "Port\u00e9e g\u00e9ographique" : "Geographic Scope"}
                  </label>
                  <select
                    value={form.geographicScope}
                    onChange={(e) => setForm({ ...form, geographicScope: e.target.value })}
                    className="input-field"
                  >
                    <option value="">--</option>
                    <option value="local">Local</option>
                    <option value="regional">{locale === "fr" ? "R\u00e9gional" : "Regional"}</option>
                    <option value="national">National</option>
                    <option value="continental">Continental</option>
                    <option value="global">Global</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    {locale === "fr" ? "Budget estim\u00e9" : "Estimated Budget"}
                  </label>
                  <input
                    value={form.estimatedBudget}
                    onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })}
                    placeholder={locale === "fr" ? "Ex: 10,000 EUR" : "e.g. $10,000"}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {locale === "fr" ? "M\u00e9thode de v\u00e9rification" : "Verification Method"}
                </label>
                <input
                  value={form.verificationMethod}
                  onChange={(e) => setForm({ ...form, verificationMethod: e.target.value })}
                  placeholder={locale === "fr" ? "Comment les r\u00e9sultats seront-ils v\u00e9rifi\u00e9s ?" : "How will results be verified?"}
                  className="input-field"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.implementationPartnerNeeded}
                  onChange={(e) => setForm({ ...form, implementationPartnerNeeded: e.target.checked })}
                  className="rounded border-white/20 bg-gray-800 text-primary-500 focus:ring-primary-500/20"
                />
                {locale === "fr" ? "Partenaire d\u2019impl\u00e9mentation n\u00e9cessaire" : "Implementation partner needed"}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? t.challengeForm.submitting : t.challengeForm.submitButton}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}
