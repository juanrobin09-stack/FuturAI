"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { useLanguage } from "@/i18n";
import toast from "react-hot-toast";

interface ShareButtonsProps {
  title: string;
  url: string;
  hashtags?: string[];
}

export default function ShareButtons({
  title,
  url,
  hashtags = ["FutureAI", "AI", "Innovation"],
}: ShareButtonsProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(url)}&hashtags=${hashtags.join(",")}`;

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    url
  )}`;

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
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
      >
        {t.share.twitter}
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/10 text-blue-300 hover:bg-blue-600/20 transition-colors"
      >
        {t.share.linkedin}
      </a>
      <button
        onClick={handleCopyLink}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-colors flex items-center gap-1"
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
