"use client";

import { useState } from "react";
import { FlaskConical, Code2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/i18n";

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
          <div key={s.id} className="card p-0 overflow-hidden">
            {/* Clickable header */}
            <button
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
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

            {/* Expanded: Code + Preview side by side */}
            {expanded === s.id && s.resultText && (
              <div className="border-t border-white/5">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Code panel */}
                  <div className="bg-gray-800/80 border-r border-white/5">
                    <div className="px-3 py-1.5 bg-gray-900/80 border-b border-white/5 flex items-center gap-1.5">
                      <Code2 className="w-3 h-3 text-primary-400" />
                      <span className="text-[10px] font-medium text-primary-400 uppercase tracking-wide">
                        Code
                      </span>
                    </div>
                    <div
                      className="p-3 overflow-auto"
                      style={{ maxHeight: "400px" }}
                    >
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                        {s.resultText}
                      </pre>
                    </div>
                  </div>

                  {/* Visual preview */}
                  <div className="bg-white">
                    <div className="px-3 py-1.5 bg-gray-100 border-b border-gray-200 flex items-center gap-1.5">
                      <Eye className="w-3 h-3 text-accent-500" />
                      <span className="text-[10px] font-medium text-accent-500 uppercase tracking-wide">
                        Preview
                      </span>
                      <span className="ml-auto text-[9px] text-gray-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                        Live
                      </span>
                    </div>
                    <iframe
                      srcDoc={generatePreviewHtml(s.resultText, s.type)}
                      className="w-full border-0"
                      style={{ minHeight: "360px", maxHeight: "500px" }}
                      sandbox="allow-scripts"
                      title={`Preview - ${s.prompt}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
