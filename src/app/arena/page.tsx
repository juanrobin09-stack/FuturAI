"use client";

import SandboxSession from "@/components/SandboxSession";
import { FlaskConical, Sparkles, Code, Image, Video, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/i18n";
import PageTransition from "@/components/animations/PageTransition";
import FadeIn from "@/components/animations/FadeIn";

export default function ArenaPage() {
  const { t } = useLanguage();

  const capabilities = [
    {
      icon: Code,
      title: t.arena.codeAI,
      desc: t.arena.codeDesc,
      color: "text-primary-400",
    },
    {
      icon: Image,
      title: t.arena.textToImage,
      desc: t.arena.imageDesc,
      color: "text-accent-400",
    },
    {
      icon: Video,
      title: t.arena.textToVideo,
      desc: t.arena.videoDesc,
      color: "text-purple-400",
    },
  ];

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center mx-auto mb-4">
            <FlaskConical className="w-8 h-8 text-accent-400" />
          </div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">{t.arena.title}</span>
          </h1>
          <p className="text-gray-400 mt-2 max-w-lg mx-auto">
            {t.arena.subtitle}
          </p>
        </div>

        {/* Capabilities */}
        <FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {capabilities.map((cap) => (
              <div key={cap.title} className="card text-center">
                <cap.icon className={`w-8 h-8 ${cap.color} mx-auto mb-3`} />
                <h3 className="font-semibold mb-1">{cap.title}</h3>
                <p className="text-sm text-gray-400">{cap.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Arena Sessions */}
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
    </PageTransition>
  );
}
