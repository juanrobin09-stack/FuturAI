import { getServerTranslations } from "@/i18n/server";
import { FileText } from "lucide-react";

export default function TermsPage() {
  const { t } = getServerTranslations();
  const te = t.terms;

  const sections = [
    { title: te.acceptanceTitle, content: te.acceptanceDesc },
    { title: te.eligibilityTitle, content: te.eligibilityDesc },
    { title: te.accountTitle, content: te.accountDesc },
    { title: te.userResponsibilitiesTitle, content: te.userResponsibilitiesDesc },
    { title: te.contentOwnershipTitle, content: te.contentOwnershipDesc },
    { title: te.platformLicenseTitle, content: te.platformLicenseDesc },
    { title: te.apiKeysTitle, content: te.apiKeysDesc },
    { title: te.prohibitedConductTitle, content: te.prohibitedConductDesc },
    { title: te.aiGeneratedContentTitle, content: te.aiGeneratedContentDesc },
    { title: te.privacyTitle, content: te.privacyDesc },
    { title: te.disclaimersTitle, content: te.disclaimersDesc },
    { title: te.limitationTitle, content: te.limitationDesc },
    { title: te.indemnificationTitle, content: te.indemnificationDesc },
    { title: te.terminationTitle, content: te.terminationDesc },
    { title: te.internationalTitle, content: te.internationalDesc },
    { title: te.governingLawTitle, content: te.governingLawDesc },
    { title: te.changesTitle, content: te.changesDesc },
    { title: te.contactTitle, content: te.contactDesc },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-accent-400" />
        </div>
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">{te.title}</span>
        </h1>
        <p className="text-gray-400 mt-2">{te.subtitle}</p>
        <p className="text-xs text-gray-500 mt-1">
          {te.lastUpdated}: 2026-02-27
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {te.effectiveDate}: 2026-03-01
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={index} className="card">
            <h2 className="text-lg font-semibold mb-3">
              {index + 1}. {section.title}
            </h2>
            <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
