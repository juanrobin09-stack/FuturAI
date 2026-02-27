import { getServerTranslations } from "@/i18n/server";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  const { t } = getServerTranslations();
  const p = t.privacy;

  const sections = [
    { title: p.introTitle, content: p.introDesc },
    { title: p.scopeTitle, content: p.scopeDesc },
    { title: p.dataCollectionTitle, content: p.dataCollectionDesc },
    { title: p.lawfulBasisTitle, content: p.lawfulBasisDesc },
    { title: p.dataStorageTitle, content: p.dataStorageDesc },
    { title: p.cookiesTitle, content: p.cookiesDesc },
    { title: p.thirdPartyTitle, content: p.thirdPartyDesc },
    { title: p.internationalTransfersTitle, content: p.internationalTransfersDesc },
    { title: p.retentionTitle, content: p.retentionDesc },
    { title: p.rightsTitle, content: p.rightsDesc },
    { title: p.gdprTitle, content: p.gdprDesc },
    { title: p.ccpaTitle, content: p.ccpaDesc },
    { title: p.internationalTitle, content: p.internationalDesc },
    { title: p.childrenTitle, content: p.childrenDesc },
    { title: p.breachNotificationTitle, content: p.breachNotificationDesc },
    { title: p.dpoTitle, content: p.dpoDesc },
    { title: p.changesTitle, content: p.changesDesc },
    { title: p.contactTitle, content: p.contactDesc },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">{p.title}</span>
        </h1>
        <p className="text-gray-400 mt-2">{p.subtitle}</p>
        <p className="text-xs text-gray-500 mt-1">
          {p.lastUpdated}: 2026-02-27
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {p.effectiveDate}: 2026-03-01
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
