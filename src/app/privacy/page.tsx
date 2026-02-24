import { getServerTranslations } from "@/i18n/server";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  const { t } = getServerTranslations();

  const sections = [
    { title: t.privacy.dataCollection, content: t.privacy.dataCollectionDesc },
    { title: t.privacy.dataStorage, content: t.privacy.dataStorageDesc },
    { title: t.privacy.cookies, content: t.privacy.cookiesDesc },
    { title: t.privacy.rights, content: t.privacy.rightsDesc },
    { title: t.privacy.contact, content: t.privacy.contactDesc },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">{t.privacy.title}</span>
        </h1>
        <p className="text-gray-400 mt-2">{t.privacy.subtitle}</p>
        <p className="text-xs text-gray-500 mt-1">
          {t.privacy.lastUpdated}: 2026-02-01
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
