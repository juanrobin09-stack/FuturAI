"use client";

import { useState, useRef, useEffect } from "react";
import { X, Download, Copy, Share2, Monitor, Smartphone, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n";
import toast from "react-hot-toast";
import { createExportCanvas, canvasToBlob, downloadBlob, generateShareText, RESOLUTIONS } from "@/lib/export";

interface ExportOverlayProps {
  show: boolean;
  onClose: () => void;
  content: string;
  type: "code" | "image" | "video";
  projectName?: string;
  contributors?: string[];
  badgeName?: string;
}

type ResolutionKey = keyof typeof RESOLUTIONS;

export default function ExportOverlay({
  show,
  onClose,
  content,
  type,
  projectName,
  contributors,
  badgeName,
}: ExportOverlayProps) {
  const { t, locale } = useLanguage();
  const [resolution, setResolution] = useState<ResolutionKey>("square");
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Generate preview when resolution or content changes
  useEffect(() => {
    if (!show) return;

    const res = RESOLUTIONS[resolution];
    const canvas = createExportCanvas({
      width: res.width,
      height: res.height,
      projectName: projectName || "FutureAI Prototype",
      contributors,
      badgeName,
      content,
      type,
    });
    canvasRef.current = canvas;

    // Show preview (scaled down)
    if (previewRef.current) {
      previewRef.current.innerHTML = "";
      const scale = Math.min(400 / canvas.width, 400 / canvas.height);
      canvas.style.width = `${canvas.width * scale}px`;
      canvas.style.height = `${canvas.height * scale}px`;
      canvas.style.borderRadius = "12px";
      previewRef.current.appendChild(canvas);
    }
  }, [show, resolution, content, type, projectName, contributors, badgeName]);

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const blob = await canvasToBlob(canvasRef.current);
      downloadBlob(blob, `futureai-${type}-${Date.now()}.png`);
      toast.success(t.export?.downloading || "Downloaded!");
    } catch {
      toast.error(t.common?.error || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await canvasToBlob(canvasRef.current);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast.success(t.export?.copyClipboard || "Copied to clipboard!");
    } catch {
      toast.error("Copy not supported in this browser");
    }
  };

  const handleShare = (platform: string) => {
    const shareText = generateShareText(projectName || "FutureAI", locale);
    const url = window.location.href;

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  const resOptions = [
    { key: "stories" as const, label: t.export?.stories || "Stories (9:16)", icon: Smartphone },
    { key: "square" as const, label: t.export?.square || "Square (1:1)", icon: Square },
    { key: "landscape" as const, label: t.export?.landscape || "Landscape (16:9)", icon: Monitor },
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="font-semibold flex items-center gap-2">
                <Share2 className="w-5 h-5 text-accent-400" />
                {t.export?.exportResult || "Export"}
              </h3>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resolution selector */}
            <div className="flex gap-2 p-4 border-b border-white/5">
              {resOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setResolution(opt.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 ${
                    resolution === opt.key
                      ? "bg-accent-500/20 text-accent-400 border border-accent-500/30"
                      : "text-gray-400 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="p-4 flex justify-center bg-gray-950/50">
              <div ref={previewRef} className="max-w-full" />
            </div>

            {/* Actions */}
            <div className="p-4 space-y-3 border-t border-white/5">
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={exporting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? "..." : t.export?.download || "Download PNG"}
                </button>
                <button
                  onClick={handleCopy}
                  className="btn-ghost flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {t.export?.copyClipboard || "Copy"}
                </button>
              </div>

              {/* Social sharing */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{t.export?.shareOn || "Share on"}:</span>
                <button
                  onClick={() => handleShare("twitter")}
                  className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs hover:bg-blue-500/20 transition-colors"
                >
                  Twitter/X
                </button>
                <button
                  onClick={() => handleShare("linkedin")}
                  className="px-3 py-1 bg-blue-600/10 text-blue-300 rounded-lg text-xs hover:bg-blue-600/20 transition-colors"
                >
                  LinkedIn
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
