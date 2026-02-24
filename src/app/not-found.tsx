"use client";

import Link from "next/link";
import { Brain } from "lucide-react";
import { useLanguage } from "@/i18n";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Brain className="w-16 h-16 text-gray-600 mb-6" />
      <h1 className="text-4xl font-bold mb-2">{t.notFound.title}</h1>
      <p className="text-gray-400 mb-6">{t.notFound.message}</p>
      <Link href="/" className="btn-primary">
        {t.notFound.backHome}
      </Link>
    </div>
  );
}
