import { getServerTranslations } from "@/i18n/server";
import { FileText } from "lucide-react";

export default function TermsPage() {
  const { t } = getServerTranslations();

  const sections = [
    { title: t.terms.acceptance, content: t.terms.acceptanceDesc },
    { title: t.terms.userResponsibilities, content: t.terms.userResponsibilitiesDesc },
    { title: t.terms.contentOwnership, content: t.terms.contentOwnershipDesc },
    { title: t.terms.apiKeys, content: t.terms.apiKeysDesc },
    { title: t.terms.termination, content: t.terms.terminationDesc },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-accent-400" />
        </div>
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">{t.terms.title}</span>
        </h1>
        <p className="text-gray-400 mt-2">{t.terms.subtitle}</p>
        <p className="text-xs text-gray-500 mt-1">
          {t.terms.lastUpdated}: 2026-02-01
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="card">
            <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
            <p className="text-sm text-gray-400 leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
