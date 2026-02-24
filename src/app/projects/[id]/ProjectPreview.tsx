"use client";

import { useState } from "react";
import { FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/i18n";
import BrowserPreview from "@/components/BrowserPreview";

interface SandboxResult {
  id: string;
  type: string;
  prompt: string;
  resultText: string | null;
  createdAt: string;
}

function generatePreviewHtml(code: string, resultType: string): string {
  const isHtml =
    /<\s*(html|body|div|h[1-6]|p|form|table|canvas|svg|section|header|main|footer|nav|button|input)\b/i.test(
      code
    );
  const hasScript = /<script[\s>]/i.test(code);

  if (isHtml || hasScript) {
    if (/<html/i.test(code)) return code;
    return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; background: #fff; color: #111; }
  pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
</style>
</head><body>
${code}
</body></html>`;
  }

  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Fira Code', 'Courier New', monospace; padding: 20px; background: #1a1a2e; color: #e0e0e0; }
  pre { white-space: pre-wrap; word-wrap: break-word; font-size: 13px; line-height: 1.6; }
  .badge { display: inline-block; background: #2d2b55; color: #a599e9; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-bottom: 12px; }
</style>
</head><body>
<span class="badge">${resultType.replace("text-to-", "").toUpperCase()}</span>
<pre>${escaped}</pre>
</body></html>`;
}

export default function ProjectPreview({
  results,
}: {
  results: SandboxResult[];
}) {
  const { locale } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>(
    results.length > 0 ? results[0].id : null
  );

  if (results.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FlaskConical className="w-5 h-5 text-accent-400" />
        {locale === "fr" ? "Prototypes generes" : "Generated Prototypes"}
        <span className="text-xs text-gray-500 font-normal ml-1">
          ({results.length})
        </span>
      </h3>

      <div className="space-y-3">
        {results.map((s) => (
          <div key={s.id} className="space-y-0">
            {/* Clickable header */}
            <button
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              className="w-full card flex items-center justify-between px-4 py-3 hover:border-accent-500/20 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-0.5 bg-accent-500/10 text-accent-400 rounded text-xs">
                  {s.type.replace("text-to-", "")}
                </span>
                <span className="text-gray-300 truncate max-w-xs">
                  {s.prompt}
                </span>
              </div>
              {expanded === s.id ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {/* Expanded: Bolt-style Browser Preview */}
            {expanded === s.id && s.resultText && (
              <div className="mt-2">
                <BrowserPreview
                  code={s.resultText}
                  previewHtml={generatePreviewHtml(s.resultText, s.type)}
                  title={s.prompt}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
