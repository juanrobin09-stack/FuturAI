"use client";

import { useLanguage } from "@/i18n";

interface VersionDiffViewProps {
  textA: string;
  textB: string;
  labelA: string;
  labelB: string;
}

function computeDiff(a: string, b: string): { type: "same" | "add" | "del"; line: string }[] {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const result: { type: "same" | "add" | "del"; line: string }[] = [];

  const maxLen = Math.max(linesA.length, linesB.length);
  let ai = 0;
  let bi = 0;

  while (ai < linesA.length || bi < linesB.length) {
    if (ai < linesA.length && bi < linesB.length && linesA[ai] === linesB[bi]) {
      result.push({ type: "same", line: linesA[ai] });
      ai++;
      bi++;
    } else if (ai < linesA.length && (bi >= linesB.length || !linesB.includes(linesA[ai]))) {
      result.push({ type: "del", line: linesA[ai] });
      ai++;
    } else if (bi < linesB.length) {
      result.push({ type: "add", line: linesB[bi] });
      bi++;
    }
  }

  return result;
}

export default function VersionDiffView({ textA, textB, labelA, labelB }: VersionDiffViewProps) {
  const { t } = useLanguage();
  const diff = computeDiff(textA || "", textB || "");
  const additions = diff.filter((d) => d.type === "add").length;
  const deletions = diff.filter((d) => d.type === "del").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-400">{labelA} → {labelB}</span>
        <span className="text-green-400">+{additions} {t.arenaEnhanced.additions.toLowerCase()}</span>
        <span className="text-red-400">-{deletions} {t.arenaEnhanced.deletions.toLowerCase()}</span>
      </div>

      {diff.length === 0 || (additions === 0 && deletions === 0) ? (
        <p className="text-sm text-gray-500">{t.arenaEnhanced.noDiff}</p>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-white/5 overflow-hidden font-mono text-sm">
          {diff.map((d, i) => (
            <div
              key={i}
              className={`px-4 py-1 border-b border-white/5 last:border-0 ${
                d.type === "add"
                  ? "bg-green-500/10 text-green-300"
                  : d.type === "del"
                  ? "bg-red-500/10 text-red-300"
                  : "text-gray-400"
              }`}
            >
              <span className="select-none mr-3 text-gray-600">
                {d.type === "add" ? "+" : d.type === "del" ? "-" : " "}
              </span>
              {d.line || "\u00A0"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
