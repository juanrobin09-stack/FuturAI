"use client";

import { useState, useTransition } from "react";
import { Send, MessageSquare, Reply, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n";
import { timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  user: { username: string; avatarUrl?: string | null };
  replies?: CommentData[];
}

interface CommentThreadProps {
  projectId: string;
  comments: CommentData[];
  onCommentAdded?: () => void;
}

export default function CommentThread({ projectId, comments, onCommentAdded }: CommentThreadProps) {
  const { t } = useLanguage();
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (parentId?: string) => {
    const text = parentId ? replyText : newComment;
    if (!text.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text.trim(), parentId }),
        });

        if (!res.ok) throw new Error("Failed");

        if (parentId) {
          setReplyText("");
          setReplyTo(null);
        } else {
          setNewComment("");
        }
        toast.success(t.comments.commentAdded);
        onCommentAdded?.();
      } catch {
        toast.error(t.comments.errorMessage);
      }
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary-400" />
        {t.comments.discussion} ({comments.length})
      </h3>

      {/* New comment input */}
      <div className="flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t.comments.addComment}
          className="input-field flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={isPending || !newComment.trim()}
          className="btn-primary shrink-0 px-4"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="group">
            <div className="bg-gray-800/30 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
                  {comment.user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{comment.user.username}</span>
                <span className="text-xs text-gray-500">{timeAgo(comment.createdAt, t.time)}</span>
              </div>
              <p className="text-sm text-gray-300">{comment.content}</p>
              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="text-xs text-gray-500 hover:text-primary-400 mt-2 flex items-center gap-1 transition-colors"
              >
                <Reply className="w-3 h-3" />
                {t.comments.reply}
              </button>

              {/* Reply input */}
              {replyTo === comment.id && (
                <div className="flex gap-2 mt-3 pl-4 border-l-2 border-primary-500/30">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={t.comments.replyPlaceholder}
                    className="input-field flex-1 text-sm py-2"
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit(comment.id)}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSubmit(comment.id)}
                    disabled={isPending}
                    className="btn-primary px-3 py-2 text-sm"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-white/5 space-y-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-800/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-[9px] font-bold text-white">
                          {reply.user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium">{reply.user.username}</span>
                        <span className="text-xs text-gray-500">{timeAgo(reply.createdAt, t.time)}</span>
                      </div>
                      <p className="text-sm text-gray-400">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            {t.comments.noComments}
          </p>
        )}
      </div>
    </div>
  );
}
