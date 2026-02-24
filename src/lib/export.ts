/**
 * Canvas-based export utilities for viral sharing
 */

interface ExportOptions {
  width: number;
  height: number;
  projectName?: string;
  contributors?: string[];
  badgeName?: string;
  content: string;
  type: "code" | "image" | "video";
}

/**
 * Create an export canvas with content + overlays
 */
export function createExportCanvas(options: ExportOptions): HTMLCanvasElement {
  const { width, height, projectName, contributors, badgeName, content, type } = options;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#030712"); // gray-950
  bgGrad.addColorStop(1, "#0f172a"); // slate-900
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Gradient border
  const borderWidth = 4;
  const borderGrad = ctx.createLinearGradient(0, 0, width, 0);
  borderGrad.addColorStop(0, "#0d9488"); // primary
  borderGrad.addColorStop(1, "#f97316"); // accent
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);

  // Content area
  const padding = 40;
  const contentY = 80;
  const contentHeight = height - 180;

  // Content background
  ctx.fillStyle = "rgba(17, 24, 39, 0.8)";
  roundRect(ctx, padding, contentY, width - 2 * padding, contentHeight, 16);

  // Content text
  ctx.fillStyle = "#d1d5db";
  ctx.font = "14px 'Courier New', monospace";
  const lines = content.split("\n").slice(0, Math.floor(contentHeight / 20));
  lines.forEach((line, i) => {
    ctx.fillText(line.slice(0, 60), padding + 16, contentY + 28 + i * 20);
  });

  // Type indicator
  const typeLabel = type === "code" ? "CODE" : type === "image" ? "IMAGE" : "VIDEO";
  ctx.fillStyle = "#0d9488";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText(typeLabel, padding + 16, contentY - 10);

  // Project name (top-left)
  if (projectName) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(projectName, padding, 50);
  }

  // Badge (top-right)
  if (badgeName) {
    ctx.fillStyle = "#f97316";
    ctx.font = "bold 14px sans-serif";
    const badgeText = `🏆 ${badgeName}`;
    const badgeWidth = ctx.measureText(badgeText).width;
    ctx.fillText(badgeText, width - padding - badgeWidth, 50);
  }

  // Contributors (bottom-left)
  if (contributors && contributors.length > 0) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "13px sans-serif";
    const contribText = `👥 ${contributors.slice(0, 3).join(", ")}${contributors.length > 3 ? ` +${contributors.length - 3}` : ""}`;
    ctx.fillText(contribText, padding, height - 50);
  }

  // Watermark (bottom-right)
  ctx.fillStyle = "#4b5563";
  ctx.font = "bold 14px sans-serif";
  const watermark = "FutureAI";
  const wmWidth = ctx.measureText(watermark).width;
  ctx.fillText(watermark, width - padding - wmWidth, height - 50);

  // Gradient line under watermark
  const wmGrad = ctx.createLinearGradient(width - padding - wmWidth - 10, 0, width - padding, 0);
  wmGrad.addColorStop(0, "#0d9488");
  wmGrad.addColorStop(1, "#f97316");
  ctx.strokeStyle = wmGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width - padding - wmWidth, height - 44);
  ctx.lineTo(width - padding, height - 44);
  ctx.stroke();

  return canvas;
}

/**
 * Export canvas as PNG blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export canvas"));
    }, "image/png");
  });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate social share text
 */
export function generateShareText(
  projectName: string,
  locale: string = "fr"
): string {
  if (locale === "fr") {
    return `🚀 Decouvrez mon prototype "${projectName}" sur FutureAI!\n\n#FutureAI #Innovation #IA #Hackathon`;
  }
  return `🚀 Check out my prototype "${projectName}" on FutureAI!\n\n#FutureAI #Innovation #AI #Hackathon`;
}

// Resolution presets
export const RESOLUTIONS = {
  stories: { width: 1080, height: 1920, label: "Stories / Reels (9:16)" },
  square: { width: 1080, height: 1080, label: "Square (1:1)" },
  landscape: { width: 1920, height: 1080, label: "Landscape (16:9)" },
};

// Helper: draw rounded rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}
