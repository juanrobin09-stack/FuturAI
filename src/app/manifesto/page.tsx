"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Globe,
  Eye,
  Award,
  Earth,
  ArrowRight,
  Sparkles,
  Code,
  Rocket,
  Users,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n";

/* ─── Word-by-word reveal ─── */
function WordReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: delay + i * 0.08, ease: "easeOut" }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ─── Pillar Card ─── */
function PillarCard({
  icon: Icon,
  title,
  desc,
  detail,
  color,
  iconColor,
  glowColor,
  index,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  detail: string;
  color: string;
  iconColor: string;
  glowColor: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      onClick={() => setExpanded(!expanded)}
      className="group cursor-pointer"
    >
      <div
        className="card relative overflow-hidden transition-all duration-300 hover:border-white/10"
        style={{
          boxShadow: expanded
            ? `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`
            : "none",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${glowColor}`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = expanded
            ? `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`
            : "none";
        }}
      >
        <div className="flex items-start gap-3 sm:gap-5">
          <div
            className={`w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-xl font-bold mb-0.5 sm:mb-1 text-white group-hover:text-white/90 transition-colors">
              {title}
            </h3>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{desc}</p>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="shrink-0 mt-0.5"
          >
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </motion.div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <p className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-white/5 text-sm sm:text-base text-gray-300 leading-relaxed pl-0 sm:pl-[76px]">
                {detail}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*            MANIFESTO PAGE                   */
/* ═══════════════════════════════════════════ */

export default function ManifestoPage() {
  const { t } = useLanguage();

  const pillars = [
    {
      icon: Globe,
      title: t.manifesto.pillar1Title,
      desc: t.manifesto.pillar1Desc,
      detail: t.manifesto.pillar1Detail,
      color: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400",
      glowColor: "rgba(59,130,246,0.15)",
    },
    {
      icon: Eye,
      title: t.manifesto.pillar2Title,
      desc: t.manifesto.pillar2Desc,
      detail: t.manifesto.pillar2Detail,
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400",
      glowColor: "rgba(168,85,247,0.15)",
    },
    {
      icon: Award,
      title: t.manifesto.pillar3Title,
      desc: t.manifesto.pillar3Desc,
      detail: t.manifesto.pillar3Detail,
      color: "from-amber-500/20 to-yellow-500/20",
      iconColor: "text-amber-400",
      glowColor: "rgba(245,158,11,0.15)",
    },
    {
      icon: Earth,
      title: t.manifesto.pillar4Title,
      desc: t.manifesto.pillar4Desc,
      detail: t.manifesto.pillar4Detail,
      color: "from-green-500/20 to-emerald-500/20",
      iconColor: "text-green-400",
      glowColor: "rgba(34,197,94,0.15)",
    },
  ];

  const steps = [
    { icon: Users, title: t.manifesto.howStep1Title, desc: t.manifesto.howStep1Desc },
    { icon: Code, title: t.manifesto.howStep2Title, desc: t.manifesto.howStep2Desc },
    { icon: Rocket, title: t.manifesto.howStep3Title, desc: t.manifesto.howStep3Desc },
  ];

  return (
    <div className="relative overflow-x-hidden">
      {/* ═══════ SECTION 1 — CINEMATIC HERO ═══════ */}
      <section className="relative min-h-[60vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Dot grid background */}
        <motion.div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          animate={{ x: [0, 16, 0], y: [0, 8, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary-500/8 rounded-full blur-[80px] sm:blur-[120px]"
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-accent-500/8 rounded-full blur-[60px] sm:blur-[100px]"
          animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/30 via-transparent to-gray-950" />

        {/* Content */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center py-12 sm:py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-primary-500/20 bg-primary-500/5 text-primary-400 text-xs sm:text-sm font-medium mb-5 sm:mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t.manifesto.title}
          </motion.div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-[1.15] mb-3 sm:mb-4">
            <WordReveal text={t.manifesto.heroLine} className="gradient-text" />
          </h1>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white/80 mb-5 sm:mb-8"
          >
            {t.manifesto.heroLine2}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="text-sm sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            {t.manifesto.subtitle}
          </motion.p>

          {/* Scroll indicator — hidden on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="hidden sm:block absolute bottom-6 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ SECTION 2 — VISION STATEMENT ═══════ */}
      <section className="relative py-12 sm:py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            {/* Decorative quote marks */}
            <span className="absolute -top-6 sm:-top-10 -left-1 sm:-left-4 text-5xl sm:text-8xl font-serif gradient-text opacity-20 select-none leading-none">
              &ldquo;
            </span>

            <div className="border-l-4 pl-4 sm:pl-10 py-1 sm:py-2"
              style={{ borderImage: "linear-gradient(to bottom, rgb(var(--color-primary-500)), rgb(var(--color-accent-500))) 1" }}
            >
              <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-light text-gray-200 leading-relaxed italic">
                {t.manifesto.visionQuote}
              </p>
            </div>

            <span className="absolute -bottom-8 sm:-bottom-14 right-0 text-5xl sm:text-8xl font-serif gradient-text opacity-20 select-none leading-none">
              &rdquo;
            </span>
          </motion.div>
        </div>
      </section>

      {/* ═══════ SECTION 3 — PILLARS ═══════ */}
      <section className="relative py-10 sm:py-20 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-16"
          >
            <span className="gradient-text">{t.manifesto.title}</span>
          </motion.h2>

          <div className="space-y-3 sm:space-y-5">
            {pillars.map((pillar, index) => (
              <PillarCard key={pillar.title} {...pillar} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 4 — HOW IT WORKS ═══════ */}
      <section className="relative py-10 sm:py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-16"
          >
            <span className="gradient-text">{t.manifesto.howTitle}</span>
          </motion.h2>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-[2px]">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary-500/40 via-accent-500/40 to-primary-500/40 origin-left"
              />
            </div>

            {/* Connecting line (mobile only — vertical) */}
            <div className="md:hidden absolute top-[52px] bottom-[52px] left-[30px] w-[2px]">
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                className="h-full bg-gradient-to-b from-primary-500/40 via-accent-500/40 to-primary-500/40 origin-top"
              />
            </div>

            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.12 }}
                className="relative flex md:flex-col items-center md:text-center gap-4 md:gap-0"
              >
                {/* Step number */}
                <div className="relative shrink-0 inline-flex items-center justify-center w-[52px] h-[52px] md:w-[64px] md:h-[64px] rounded-full bg-gray-900 border-2 border-primary-500/30 md:mb-5 z-10">
                  <span className="text-lg md:text-2xl font-black gradient-text">{i + 1}</span>
                </div>

                <div className="flex-1 md:flex-initial">
                  <div className="flex items-center md:justify-center mb-1 sm:mb-2">
                    <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400 mr-1.5 sm:mr-2" />
                    <h3 className="text-base sm:text-xl font-bold text-white">{step.title}</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-xs">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 5 — EPIC CTA ═══════ */}
      <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/20 to-transparent" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[200px] sm:h-[400px] bg-primary-500/5 rounded-full blur-[80px] sm:blur-[150px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating particles — hidden on mobile */}
        {[
          { x: "15%", y: "25%", delay: 0 },
          { x: "80%", y: "60%", delay: 1 },
          { x: "60%", y: "20%", delay: 2 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="hidden sm:block absolute w-2 h-2 rounded-full bg-primary-400/20"
            style={{ left: p.x, top: p.y }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 leading-tight">
              <span className="gradient-text">{t.manifesto.ctaTitle}</span>
            </h2>
            <p className="text-base sm:text-xl md:text-2xl text-gray-400 mb-8 sm:mb-12 font-light">
              {t.manifesto.ctaSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/challenges"
                className="btn-accent text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 inline-flex items-center gap-2 group w-full sm:w-auto justify-center"
              >
                {t.manifesto.ctaPrimary}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/projects"
                className="btn-ghost text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 inline-flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                {t.manifesto.ctaSecondary}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
