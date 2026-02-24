import IdeaForm from "@/components/IdeaForm";
import { Lightbulb } from "lucide-react";
import { getServerTranslations } from "@/i18n/server";

export default function SubmitIdeaPage() {
  const { t } = getServerTranslations();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-8 h-8 text-accent-400" />
        </div>
        <h1 className="text-3xl font-bold">
          {t.ideaForm.pageTitle} <span className="gradient-text">{t.ideaForm.pageTitleHighlight}</span>
        </h1>
        <p className="text-gray-400 mt-2">
          {t.ideaForm.pageSubtitle}
        </p>
      </div>

      <div className="card">
        <IdeaForm />
      </div>
    </div>
  );
}
