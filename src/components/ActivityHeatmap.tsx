"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useLanguage } from "@/i18n";

interface HeatmapDay {
  date: string;
  count: number;
}

interface HeatmapData {
  heatmap: HeatmapDay[];
  totalThisWeek: number;
  totalThisMonth: number;
}

interface ActivityHeatmapProps {
  userId: string;
  refreshKey?: number;
}

const COLOR_SCALE = [
  "fill-gray-800/60",       // 0
  "fill-primary-900",       // 1-2
  "fill-primary-700",       // 3-5
  "fill-primary-500",       // 6-9
  "fill-primary-300",       // 10+
];

function getColorClass(count: number): string {
  if (count === 0) return COLOR_SCALE[0];
  if (count <= 2) return COLOR_SCALE[1];
  if (count <= 5) return COLOR_SCALE[2];
  if (count <= 9) return COLOR_SCALE[3];
  return COLOR_SCALE[4];
}

const CELL_SIZE = 12;
const GAP = 2;
const ROWS = 7;
const COLS = 13; // ~91 days

export default function ActivityHeatmap({ userId, refreshKey = 0 }: ActivityHeatmapProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<HeatmapData | null>(null);
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  useEffect(() => {
    fetch(`/api/users/activity-heatmap?userId=${userId}&days=91`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [userId, refreshKey]);

  if (!data) return null;

  // Build a map of date → count
  const countMap = new Map<string, number>();
  data.heatmap.forEach((d) => countMap.set(d.date, d.count));

  // Generate 91 days ending today
  const days: { date: string; count: number; col: number; row: number }[] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (COLS * ROWS - 1));

  for (let i = 0; i < COLS * ROWS; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const col = Math.floor(i / ROWS);
    const row = i % ROWS;
    days.push({
      date: dateStr,
      count: countMap.get(dateStr) || 0,
      col,
      row,
    });
  }

  // Month labels
  const months: { label: string; col: number }[] = [];
  let lastMonth = -1;
  days.forEach((d) => {
    const month = new Date(d.date).getMonth();
    if (month !== lastMonth && d.row === 0) {
      const monthName = new Date(d.date).toLocaleDateString("default", { month: "short" });
      months.push({ label: monthName, col: d.col });
      lastMonth = month;
    }
  });

  const svgWidth = COLS * (CELL_SIZE + GAP) - GAP;
  const svgHeight = ROWS * (CELL_SIZE + GAP) - GAP + 16; // +16 for month labels

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-400 shrink-0" />
          {t.engagement.activityTitle}
        </h3>
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500">
          <span>
            <strong className="text-gray-300">{data.totalThisWeek}</strong>{" "}
            {t.engagement.actionsLabel} {t.engagement.activityThisWeek}
          </span>
          <span>
            <strong className="text-gray-300">{data.totalThisMonth}</strong>{" "}
            {t.engagement.actionsLabel} {t.engagement.activityThisMonth}
          </span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="mx-auto"
          style={{ minWidth: svgWidth }}
        >
          {/* Month labels */}
          {months.map((m, i) => (
            <text
              key={i}
              x={m.col * (CELL_SIZE + GAP)}
              y={10}
              className="fill-gray-600 text-[9px]"
            >
              {m.label}
            </text>
          ))}

          {/* Cells */}
          {days.map((day, i) => (
            <motion.rect
              key={day.date}
              x={day.col * (CELL_SIZE + GAP)}
              y={day.row * (CELL_SIZE + GAP) + 16}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              className={`${getColorClass(day.count)} transition-colors cursor-pointer`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.003, duration: 0.2 }}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredDay && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 px-2 py-1 rounded bg-gray-800 border border-white/10 text-xs text-gray-300 whitespace-nowrap pointer-events-none z-10">
            {hoveredDay.date}: {hoveredDay.count} {t.engagement.actionsLabel}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center sm:justify-end gap-0.5 sm:gap-1 mt-3 text-[8px] sm:text-[10px] text-gray-600 flex-wrap">
        <span>{t.engagement.lessActive}</span>
        {COLOR_SCALE.map((c, i) => (
          <svg key={i} width={10} height={10}>
            <rect width={10} height={10} rx={2} className={c} />
          </svg>
        ))}
        <span>{t.engagement.moreActive}</span>
      </div>
    </div>
  );
}
