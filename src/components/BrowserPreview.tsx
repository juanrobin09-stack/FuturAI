"use client";

import { useState, useRef } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  Maximize2,
  Minimize2,
  Code2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface BrowserPreviewProps {
  code: string;
  previewHtml: string;
  title?: string;
  version?: string;
}

const DEVICES = [
  { key: "desktop", icon: Monitor, width: "100%", label: "Desktop" },
  { key: "tablet", icon: Tablet, width: "768px", label: "Tablet" },
  { key: "mobile", icon: Smartphone, width: "375px", label: "Mobile" },
] as const;

export default function BrowserPreview({
  code,
  previewHtml,
  title,
  version,
}: BrowserPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showCode, setShowCode] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selectedDevice = DEVICES.find((d) => d.key === device)!;

  const codeWithLines = code.split("\n");

  return (
    <div
      className={`rounded-xl border border-white/10 overflow-hidden bg-[#1e1e2e] ${
        fullscreen ? "fixed inset-4 z-50 shadow-2xl" : ""
      }`}
    >
      {/* ─── Top toolbar ─── */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#181825] border-b border-white/5">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 mr-3">
            <span className="w-3 h-3 rounded-full bg-[#f38ba8] hover:brightness-110 cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-[#f9e2af] hover:brightness-110 cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-[#a6e3a1] hover:brightness-110 cursor-pointer" />
          </div>

          {/* Code / Preview toggle */}
          <button
            onClick={() => setShowCode(!showCode)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              showCode
                ? "bg-[#313244] text-[#cdd6f4]"
                : "text-[#6c7086] hover:text-[#cdd6f4]"
            }`}
          >
            <Code2 className="w-3 h-3" />
            Code
          </button>
        </div>

        {/* Center: URL bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="flex items-center gap-2 bg-[#313244] rounded-lg px-3 py-1.5">
            <ChevronLeft className="w-3 h-3 text-[#585b70] cursor-pointer hover:text-[#cdd6f4]" />
            <ChevronRight className="w-3 h-3 text-[#585b70] cursor-pointer hover:text-[#cdd6f4]" />
            <div className="flex-1 flex items-center gap-2">
              <svg className="w-3 h-3 text-[#a6e3a1] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-[11px] text-[#a6adc8] truncate">
                {title ? `preview.futurai.space/${title.toLowerCase().replace(/\s+/g, "-")}` : "preview.futurai.space/prototype"}
              </span>
            </div>
            <RotateCcw
              className="w-3 h-3 text-[#585b70] cursor-pointer hover:text-[#cdd6f4] transition-colors"
              onClick={() => setIframeKey((k) => k + 1)}
            />
          </div>
        </div>

        {/* Right: device + fullscreen */}
        <div className="flex items-center gap-1">
          {DEVICES.map((d) => (
            <button
              key={d.key}
              onClick={() => setDevice(d.key)}
              className={`p-1.5 rounded-md transition-all ${
                device === d.key
                  ? "bg-[#45475a] text-[#cdd6f4]"
                  : "text-[#585b70] hover:text-[#cdd6f4]"
              }`}
              title={d.label}
            >
              <d.icon className="w-3.5 h-3.5" />
            </button>
          ))}
          <div className="w-px h-4 bg-[#313244] mx-1" />
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-1.5 rounded-md text-[#585b70] hover:text-[#cdd6f4] transition-all"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ─── Version badge ─── */}
      {version && (
        <div className="px-3 py-1 bg-[#1e1e2e] border-b border-white/5 flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cba6f7]/10 text-[#cba6f7] border border-[#cba6f7]/20 font-medium">
            {version}
          </span>
          <span className="text-[10px] text-[#585b70]">
            {selectedDevice.label} — {selectedDevice.width === "100%" ? "Full width" : selectedDevice.width}
          </span>
        </div>
      )}

      {/* ─── Content: Code panel + Browser preview ─── */}
      <div className={`grid ${showCode ? "grid-cols-1 lg:grid-cols-[380px_1fr]" : "grid-cols-1"}`}>
        {/* Code editor panel */}
        {showCode && (
          <div className="bg-[#1e1e2e] border-r border-white/5 overflow-hidden flex flex-col">
            {/* File tab */}
            <div className="flex items-center gap-0 bg-[#181825] border-b border-white/5 px-1">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e2e] border-r border-white/5 text-[11px] text-[#cdd6f4]">
                <Code2 className="w-3 h-3 text-[#89b4fa]" />
                <span>prototype.tsx</span>
                <X className="w-2.5 h-2.5 text-[#585b70] hover:text-[#cdd6f4] cursor-pointer" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#585b70]">
                output.log
              </div>
            </div>

            {/* Code with line numbers */}
            <div
              className="overflow-auto flex-1 text-[12px] leading-[1.7]"
              style={{ maxHeight: fullscreen ? "calc(100vh - 120px)" : "500px" }}
            >
              <table className="w-full border-collapse">
                <tbody>
                  {codeWithLines.map((line, i) => (
                    <tr key={i} className="hover:bg-[#313244]/30">
                      <td className="text-right pr-4 pl-3 text-[#585b70] select-none w-10 align-top font-mono">
                        {i + 1}
                      </td>
                      <td className="pr-4 font-mono text-[#cdd6f4] whitespace-pre-wrap break-all">
                        {highlightCode(line)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Browser preview panel */}
        <div className="bg-[#f5f5f5] flex flex-col items-center overflow-hidden">
          {/* Preview tabs bar */}
          <div className="w-full flex items-center justify-between px-3 py-1.5 bg-white border-b border-gray-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-gray-500 font-medium">LIVE PREVIEW</span>
            </div>
            <button
              className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* iframe container with device frame */}
          <div
            className="transition-all duration-300 ease-in-out w-full flex justify-center py-2"
            style={{
              backgroundColor: device !== "desktop" ? "#e5e5e5" : "transparent",
            }}
          >
            <div
              className={`bg-white transition-all duration-300 ease-in-out overflow-hidden ${
                device !== "desktop"
                  ? "rounded-2xl shadow-xl border border-gray-300"
                  : "w-full"
              }`}
              style={{
                width: selectedDevice.width,
                maxWidth: "100%",
              }}
            >
              {/* Device notch for mobile */}
              {device === "mobile" && (
                <div className="bg-black h-7 flex items-center justify-center">
                  <div className="w-20 h-4 bg-gray-900 rounded-full" />
                </div>
              )}
              <iframe
                ref={iframeRef}
                key={iframeKey}
                srcDoc={previewHtml}
                className="w-full border-0"
                style={{
                  minHeight: fullscreen
                    ? "calc(100vh - 140px)"
                    : device === "mobile"
                    ? "600px"
                    : device === "tablet"
                    ? "500px"
                    : "480px",
                }}
                sandbox="allow-scripts"
                title="Live Preview"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen overlay backdrop */}
      {fullscreen && (
        <div
          className="fixed inset-0 bg-black/60 -z-10"
          onClick={() => setFullscreen(false)}
        />
      )}
    </div>
  );
}

/** Simple syntax highlighting for code lines */
function highlightCode(line: string): React.ReactNode {
  // Comments
  if (/^\s*(\/\/|#)/.test(line)) {
    return <span className="text-[#6c7086] italic">{line}</span>;
  }

  const parts: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  const patterns: [RegExp, string][] = [
    [/\b(import|export|from|const|let|var|function|class|return|if|else|for|while|async|await|new|try|catch|throw|default|interface|type)\b/g, "text-[#cba6f7]"],
    [/\b(true|false|null|undefined|void|this)\b/g, "text-[#f38ba8]"],
    [/\b(\d+\.?\d*)\b/g, "text-[#fab387]"],
    [/(["'`])(?:(?!\1).)*\1/g, "text-[#a6e3a1]"],
    [/\b([A-Z]\w+)\b/g, "text-[#f9e2af]"],
  ];

  // Simple approach: just apply the first keyword match coloring
  let hasMatch = false;
  for (const [pattern, color] of patterns) {
    const regex = new RegExp(pattern.source, "g");
    let match;
    let lastIndex = 0;
    const localParts: React.ReactNode[] = [];

    while ((match = regex.exec(remaining)) !== null) {
      hasMatch = true;
      if (match.index > lastIndex) {
        localParts.push(
          <span key={key++}>{remaining.slice(lastIndex, match.index)}</span>
        );
      }
      localParts.push(
        <span key={key++} className={color}>
          {match[0]}
        </span>
      );
      lastIndex = regex.lastIndex;
    }

    if (localParts.length > 0) {
      if (lastIndex < remaining.length) {
        localParts.push(
          <span key={key++}>{remaining.slice(lastIndex)}</span>
        );
      }
      return <>{localParts}</>;
    }
  }

  return line;
}
