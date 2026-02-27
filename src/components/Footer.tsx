"use client";

import Link from "next/link";
import { Mail, Github, ExternalLink } from "lucide-react";
import { useLanguage } from "@/i18n";
import FutureAILogo from "./FutureAILogo";

export default function Footer() {
  const { t, locale } = useLanguage();

  return (
    <footer className="border-t border-white/5 bg-gray-950 relative overflow-hidden">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8">
          {/* Brand — wider */}
          <div className="col-span-2 md:col-span-5">
            <div className="flex items-center gap-2 mb-4">
              <FutureAILogo size={32} />
              <span className="text-lg font-bold gradient-text">FutureAI</span>
            </div>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              {t.footer.description}
            </p>
            <div className="flex gap-3 mt-5">
              <a
                href="mailto:contact@futurai.space"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/15 transition-all"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/juanrobin09-stack/FuturAI"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/15 transition-all"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">{t.footer.platform}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/ideas" className="text-gray-500 hover:text-white transition-colors">{t.footer.exploreIdeas}</Link></li>
              <li><Link href="/projects" className="text-gray-500 hover:text-white transition-colors">{t.nav.projects}</Link></li>
              <li><Link href="/arena" className="text-gray-500 hover:text-white transition-colors">{t.footer.arena}</Link></li>
              <li><Link href="/leaderboard" className="text-gray-500 hover:text-white transition-colors">{t.nav.leaderboard}</Link></li>
              <li><Link href="/map" className="text-gray-500 hover:text-white transition-colors">{t.footer.worldMap}</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">{t.footer.community}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/manifesto" className="text-gray-500 hover:text-white transition-colors">{t.footer.manifesto}</Link></li>
              <li><Link href="/impact-dashboard" className="text-gray-500 hover:text-white transition-colors">{locale === "fr" ? "Tableau d'impact" : "Impact Dashboard"}</Link></li>
              <li><Link href="/public-methodology" className="text-gray-500 hover:text-white transition-colors">{t.methodology.title}</Link></li>
              <li><Link href="/governance" className="text-gray-500 hover:text-white transition-colors">{locale === "fr" ? "Gouvernance" : "Governance"}</Link></li>
              <li><a href="mailto:contact@futurai.space" className="text-gray-500 hover:text-white transition-colors">{t.footer.contact}</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">{locale === "fr" ? "L\u00e9gal" : "Legal"}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="text-gray-500 hover:text-white transition-colors">{t.footer.privacy}</Link></li>
              <li><Link href="/terms" className="text-gray-500 hover:text-white transition-colors">{t.footer.terms}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} FutureAI. {t.footer.copyright}</p>
          <p className="flex items-center gap-1">
            {locale === "fr" ? "Open source sur" : "Open source on"}
            <a
              href="https://github.com/juanrobin09-stack/FuturAI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
