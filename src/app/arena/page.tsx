"use client";

import SandboxSession from "@/components/SandboxSession";
import { FlaskConical, Sparkles, Code, Image, Video, AlertTriangle, ArrowDown, Zap, Gift, UserCheck, Radio } from "lucide-react";
import { useLanguage } from "@/i18n";
import PageTransition from "@/components/animations/PageTransition";
import FadeIn from "@/components/animations/FadeIn";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerList";

export default function ArenaPage() {
  const { t, locale } = useLanguage();

  const capabilities = [
    {
      icon: Code,
      title: t.arena.codeAI,
      desc: t.arena.codeDesc,
      color: "text-primary-400",
      bg: "from-primary-500/20 to-primary-500/5",
      border: "border-primary-500/20",
    },
    {
      icon: Image,
      title: t.arena.textToImage,
      desc: t.arena.imageDesc,
      color: "text-accent-400",
      bg: "from-accent-500/20 to-accent-500/5",
      border: "border-accent-500/20",
    },
    {
      icon: Video,
      title: t.arena.textToVideo,
      desc: t.arena.videoDesc,
      color: "text-purple-400",
      bg: "from-purple-500/20 to-purple-500/5",
      border: "border-purple-500/20",
    },
  ];

  return (
    <PageTransition>
      <div className="relative">
        {/* ─── Hero Section ─── */}
        <section className="relative overflow-hidden border-b border-white/5">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-accent-950/30 via-gray-950 to-gray-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-radial from-accent-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-32 right-1/4 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-20 left-1/4 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-10 sm:pt-20 sm:pb-14">
            <FadeIn delay={0.1}>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-500/20 bg-accent-500/5 text-accent-400 text-xs font-medium mb-6">
                  <Zap className="w-3.5 h-3.5" />
                  {locale === "fr" ? "9 fournisseurs IA disponibles" : "9 AI providers available"}
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
                  <span className="gradient-text">{t.arena.title}</span>
                </h1>
                <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg mb-8">
                  {t.arena.subtitle}
                </p>

                <a href="#arena-session" className="inline-flex items-center gap-2 text-sm text-accent-400 hover:text-accent-300 transition-colors">
                  <ArrowDown className="w-4 h-4 animate-bounce" />
                  {locale === "fr" ? "Commencer maintenant" : "Start now"}
                </a>
              </div>
            </FadeIn>

            {/* Capabilities */}
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10" staggerDelay={0.12}>
              {capabilities.map((cap) => (
                <StaggerItem key={cap.title}>
                  <div className={`card bg-gradient-to-br ${cap.bg} border ${cap.border} text-center group hover:scale-[1.02] transition-transform`}>
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <cap.icon className={`w-6 h-6 ${cap.color}`} />
                    </div>
                    <h3 className="font-semibold mb-1">{cap.title}</h3>
                    <p className="text-sm text-gray-400">{cap.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Quick info chips */}
            <FadeIn delay={0.5}>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                {[
                  { label: locale === "fr" ? "Gratuit" : "Free", Icon: Gift },
                  { label: locale === "fr" ? "Sans inscription requise" : "No signup required", Icon: UserCheck },
                  { label: locale === "fr" ? "Résultats en temps réel" : "Real-time results", Icon: Radio },
                ].map((chip) => (
                  <span key={chip.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400">
                    <chip.Icon className="w-3.5 h-3.5 text-gray-500" />
                    {chip.label}
                  </span>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ─── Arena Sessions ─── */}
        <div id="arena-session" className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <SandboxSession />

          {/* AI Notice */}
          <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200/80">
              <p className="font-medium text-amber-300 mb-1">{t.arena.aiNoticeTitle}</p>
              <p>{t.arena.aiNoticeDesc}</p>
            </div>
          </div>

          {/* Tips */}
          <div className="card mt-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-accent-400" />
              {t.arena.tips}
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>{t.arena.tip1}</li>
              <li>{t.arena.tip2}</li>
              <li>{t.arena.tip3}</li>
              <li>{t.arena.tip4}</li>
            </ul>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
