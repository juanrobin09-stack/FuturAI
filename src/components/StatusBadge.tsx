"use client";

import { getStatusColor, getStatusLabel } from "@/lib/utils";
import { useLanguage } from "@/i18n";

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const { t } = useLanguage();
  const color = getStatusColor(status);

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ backgroundColor: color }}
      />
      {label || getStatusLabel(status, t.statuses)}
    </span>
  );
}
