"use client";

import dynamic from "next/dynamic";
import { Globe } from "lucide-react";
import { useLanguage } from "@/i18n";
import { CATEGORIES, getCategoryLabel } from "@/lib/utils";
import PageTransition from "@/components/animations/PageTransition";

const WorldMap = dynamic(() => import("@/components/WorldMap"), { ssr: false });

export default function MapPage() {
  const { t } = useLanguage();

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold">
            {t.map.title} <span className="gradient-text">{t.map.titleHighlight}</span>
          </h1>
          <p className="text-gray-400 mt-2">
            {t.map.subtitle}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm">
          {CATEGORIES.map((cat) => (
            <div key={cat.value} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-gray-400">{getCategoryLabel(cat.value, t.categories)}</span>
            </div>
          ))}
        </div>

        <WorldMap />
      </div>
    </PageTransition>
  );
}
