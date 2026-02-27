"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useLanguage } from "@/i18n";
import FutureAILogo from "./FutureAILogo";

export default function Footer() {
  const { t, locale } = useLanguage();

  return (
    <footer className="border-t border-white/5 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <FutureAILogo size={36} />
              <span className="text-xl font-bold gradient-text">FutureAI</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              {t.footer.description}
            </p>
            <div className="flex gap-4 mt-4">
              <a
                href="mailto:contact@futurai.space"
                className="text-gray-400 hover:text-white transition-colors"
                title="Contact"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t.footer.platform}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/ideas" className="text-gray-400 hover:text-white transition-colors">{t.footer.exploreIdeas}</Link></li>
              <li><Link href="/leaderboard" className="text-gray-400 hover:text-white transition-colors">{t.nav.leaderboard}</Link></li>
              <li><Link href="/map" className="text-gray-400 hover:text-white transition-colors">{t.footer.worldMap}</Link></li>
              <li><Link href="/arena" className="text-gray-400 hover:text-white transition-colors">{t.footer.arena}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t.footer.community}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/manifesto" className="text-gray-400 hover:text-white transition-colors">{t.footer.manifesto}</Link></li>
              <li><Link href="/manifesto" className="text-gray-400 hover:text-white transition-colors">{t.footer.about}</Link></li>
              <li><span className="text-gray-600 cursor-default">{t.footer.blog}</span></li>
              <li><span className="text-gray-600 cursor-default">{t.footer.newsletter}</span></li>
              <li><a href="mailto:contact@futurai.space" className="text-gray-400 hover:text-white transition-colors">{t.footer.contact}</a></li>
              <li><Link href="/public-methodology" className="text-gray-400 hover:text-white transition-colors">{t.methodology.title}</Link></li>
              <li><Link href="/governance" className="text-gray-400 hover:text-white transition-colors">{locale === "fr" ? "Gouvernance" : "Governance"}</Link></li>
              <li><Link href="/impact-dashboard" className="text-gray-400 hover:text-white transition-colors">{locale === "fr" ? "Tableau d'impact" : "Impact Dashboard"}</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">{t.footer.privacy}</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">{t.footer.terms}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} FutureAI. {t.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
