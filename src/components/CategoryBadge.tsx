"use client";

import { getCategoryColor, getCategoryLabel } from "@/lib/utils";
import { useLanguage } from "@/i18n";

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
  label?: string;
}

export default function CategoryBadge({ category, size = "sm", label }: CategoryBadgeProps) {
  const { t } = useLanguage();
  const color = getCategoryColor(category);

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      {label || getCategoryLabel(category, t.categories)}
    </span>
  );
}
