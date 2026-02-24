"use client";

import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { useLanguage } from "@/i18n";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ConsentBanner() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user needs consent
    const checkConsent = async () => {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user && !data.user.consentGiven) {
            setShow(true);
          }
        }
      } catch {
        // Not logged in or error — don't show banner
      }
    };
    checkConsent();
  }, []);

  const handleAccept = async () => {
    try {
      await fetch("/api/user/consent", { method: "POST" });
      setShow(false);
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-3xl mx-auto glass rounded-2xl border border-white/10 p-4 sm:p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-primary-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">{t.consent.title}</h3>
                <p className="text-xs text-gray-400 mb-3">
                  {t.consent.message}{" "}
                  <Link href="/terms" className="text-primary-400 hover:underline">{t.consent.termsLink}</Link>
                  {" & "}
                  <Link href="/privacy" className="text-primary-400 hover:underline">{t.consent.privacyLink}</Link>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleAccept}
                    className="btn-primary text-xs px-4 py-1.5"
                  >
                    {t.consent.accept}
                  </button>
                  <button
                    onClick={() => setShow(false)}
                    className="btn-ghost text-xs px-4 py-1.5"
                  >
                    {t.consent.decline}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
