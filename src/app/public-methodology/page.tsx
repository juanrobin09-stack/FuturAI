import { getServerTranslations } from "@/i18n/server";
import { Award, GitBranch, Users, Layers, BarChart3 } from "lucide-react";

export default function PublicMethodologyPage() {
  const { t } = getServerTranslations();

  const dimensions = [
    {
      icon: Award,
      title: t.methodology.expertScoreTitle,
      desc: t.methodology.expertScoreDesc,
      color: "from-purple-500/20 to-purple-600/10",
      iconColor: "text-purple-400",
    },
    {
      icon: GitBranch,
      title: t.methodology.contributionDepthTitle,
      desc: t.methodology.contributionDepthDesc,
      color: "from-primary-500/20 to-primary-600/10",
      iconColor: "text-primary-400",
    },
    {
      icon: Users,
      title: t.methodology.collaborationIndexTitle,
      desc: t.methodology.collaborationIndexDesc,
      color: "from-accent-500/20 to-accent-600/10",
      iconColor: "text-accent-400",
    },
    {
      icon: Layers,
      title: t.methodology.solutionMaturityTitle,
      desc: t.methodology.solutionMaturityDesc,
      color: "from-emerald-500/20 to-emerald-600/10",
      iconColor: "text-emerald-400",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">{t.methodology.title}</span>
        </h1>
        <p className="text-gray-400 mt-2">{t.methodology.subtitle}</p>
      </div>

      {/* Dimension Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {dimensions.map((dim) => (
          <div key={dim.title} className={`card bg-gradient-to-br ${dim.color} border-white/5`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-900/50 flex items-center justify-center shrink-0">
                <dim.icon className={`w-5 h-5 ${dim.iconColor}`} />
              </div>
              <div>
                <h3 className="font-semibold mb-2">{dim.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{dim.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formula */}
      <div className="card text-center">
        <h2 className="text-lg font-semibold mb-3">{t.methodology.formulaTitle}</h2>
        <div className="bg-gray-800/50 rounded-xl p-6 font-mono text-sm">
          <p className="text-gray-300">{t.methodology.formulaDesc}</p>
        </div>
      </div>
    </div>
  );
}
