import Link from "next/link";
import { Globe, Eye, Award, Earth, ArrowRight } from "lucide-react";
import { getServerTranslations } from "@/i18n/server";

export default function ManifestoPage() {
  const { t } = getServerTranslations();

  const pillars = [
    {
      icon: Globe,
      title: t.manifesto.pillar1Title,
      desc: t.manifesto.pillar1Desc,
      color: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400",
    },
    {
      icon: Eye,
      title: t.manifesto.pillar2Title,
      desc: t.manifesto.pillar2Desc,
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400",
    },
    {
      icon: Award,
      title: t.manifesto.pillar3Title,
      desc: t.manifesto.pillar3Desc,
      color: "from-amber-500/20 to-yellow-500/20",
      iconColor: "text-amber-400",
    },
    {
      icon: Earth,
      title: t.manifesto.pillar4Title,
      desc: t.manifesto.pillar4Desc,
      color: "from-green-500/20 to-emerald-500/20",
      iconColor: "text-green-400",
    },
  ];

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/50 via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-20 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
            <span className="gradient-text">{t.manifesto.heroLine}</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {t.manifesto.subtitle}
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
          <span className="gradient-text">{t.manifesto.title}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="card group">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <pillar.icon className={`w-7 h-7 ${pillar.iconColor}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{pillar.title}</h3>
              <p className="text-gray-400">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 text-center">
        <div className="card border-primary-500/20 bg-gradient-to-br from-primary-500/5 to-accent-500/5 py-12">
          <h2 className="text-2xl font-bold mb-4">{t.manifesto.joinMovement}</h2>
          <Link
            href="/projects"
            className="btn-accent text-lg px-8 py-4 inline-flex items-center gap-2"
          >
            {t.manifesto.cta}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
