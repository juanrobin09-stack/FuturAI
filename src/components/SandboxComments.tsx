"use client";

import { useState, useEffect } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { useLanguage } from "@/i18n";
import { timeAgo } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SandboxCommentData {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; avatarUrl?: string | null };
}

interface SandboxCommentsProps {
  sessionId: string;
  initialComments?: SandboxCommentData[];
}

export default function SandboxComments({ sessionId, initialComments = [] }: SandboxCommentsProps) {
  const { t } = useLanguage();
  const [comments, setComments] = useState<SandboxCommentData[]>(initialComments);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // Poll for new comments every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sandbox/sessions/${sessionId}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch {
        // Ignore polling errors
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const handleSubmit = async () => {
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/sandbox/sessions/${sessionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setContent("");
      }
    } catch {
      // Silently fail
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary-400" />
        {t.comments?.discussion || "Discussion"} ({comments.length})
      </h4>

      {/* Comment list */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {comment.user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{comment.user.username}</span>
                  <span className="text-[10px] text-gray-500">{timeAgo(comment.createdAt, t.time)}</span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5">{comment.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Comment input */}
      <div className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t.comments?.addComment || "Add a comment..."}
          className="input-field flex-1 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          disabled={sending || !content.trim()}
          className="btn-primary px-3 shrink-0"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
