"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { useLanguage } from "@/i18n";
import toast from "react-hot-toast";

interface ShareButtonsProps {
  title: string;
  url: string;
  hashtags?: string[];
  contentType?: string;
  contentId?: string;
}

async function trackShare(contentType: string, contentId: string, platform: string) {
  try {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType, contentId, platform }),
    });
    const data = await res.json();
    if (data.pointsAwarded > 0) {
      toast.success(`+${data.pointsAwarded} pts`, { icon: "\u{1F31F}", duration: 2000 });
    }
  } catch {
    // Silently ignore tracking errors
  }
}

export default function ShareButtons({
  title,
  url,
  hashtags = ["FutureAI", "AI", "Innovation"],
  contentType,
  contentId,
}: ShareButtonsProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(url)}&hashtags=${hashtags.join(",")}`;

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    url
  )}`;

  const handleShareClick = (platform: string) => {
    if (contentType && contentId) {
      trackShare(contentType, contentId, platform);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t.share.linkCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success(t.share.linkCopied);
      setTimeout(() => setCopied(false), 2000);
    }
    if (contentType && contentId) {
      trackShare(contentType, contentId, "copy");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleShareClick("twitter")}
        className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
      >
        {t.share.twitter}
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleShareClick("linkedin")}
        className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium bg-blue-600/10 text-blue-300 hover:bg-blue-600/20 transition-colors"
      >
        {t.share.linkedin}
      </a>
      <button
        onClick={handleCopyLink}
        className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-colors flex items-center gap-1"
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-400" />
        ) : (
          <Link2 className="w-3 h-3" />
        )}
        {t.share.copyLink}
      </button>
    </div>
  );
}
