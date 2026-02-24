"use client";

import { CATEGORIES, getCategoryLabel } from "@/lib/utils";
import { useLanguage } from "@/i18n";

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("")}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          selected === ""
            ? "bg-white/10 text-white border border-white/20"
            : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
        }`}
      >
        {t.common.allF}
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            selected === cat.value
              ? "text-white border"
              : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
          style={
            selected === cat.value
              ? {
                  backgroundColor: `${cat.color}20`,
                  borderColor: `${cat.color}50`,
                  color: cat.color,
                }
              : undefined
          }
        >
          {getCategoryLabel(cat.value, t.categories)}
        </button>
      ))}
    </div>
  );
}
