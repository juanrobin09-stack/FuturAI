"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Send, FileText, HelpCircle, Lightbulb, Reply } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n";
import toast from "react-hot-toast";

interface CommentAuthor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface IdeaCommentData {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  author: CommentAuthor;
  replies?: IdeaCommentData[];
}

interface Props {
  ideaId: string;
}

const typeConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> = {
  comment: { icon: MessageCircle, label: "Commentaire", color: "text-gray-400" },
  resource: { icon: FileText, label: "Ressource", color: "text-blue-400" },
  question: { icon: HelpCircle, label: "Question", color: "text-amber-400" },
  suggestion: { icon: Lightbulb, label: "Suggestion", color: "text-primary-400" },
};

function timeAgoShort(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "a l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}j`;
  return `${Math.floor(days / 30)}mo`;
}

function CommentItem({
  comment,
  ideaId,
  onReplyAdded,
  isReply = false,
}: {
  comment: IdeaCommentData;
  ideaId: string;
  onReplyAdded: () => void;
  isReply?: boolean;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  const config = typeConfig[comment.type] || typeConfig.comment;
  const Icon = config.icon;
  const initial = comment.author.username.charAt(0).toUpperCase();

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent.trim(),
          type: "comment",
          parentId: comment.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erreur");
        return;
      }
      setReplyContent("");
      setShowReply(false);
      onReplyAdded();
      toast.success("Reponse publiee !");
    } catch {
      toast.error("Erreur reseau");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? "ml-4 sm:ml-8 pl-3 sm:pl-4 border-l border-white/5" : ""}`}
    >
      <div className="flex gap-3 py-3">
        {/* Avatar */}
        <div className="shrink-0">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.username}
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center text-xs font-bold text-white">
              {initial}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">
              {comment.author.username}
            </span>
            <span className={`flex items-center gap-1 text-xs ${config.color}`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
            <span className="text-xs text-gray-600">{timeAgoShort(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          {!isReply && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-400 mt-1.5 transition-colors"
            >
              <Reply className="w-3 h-3" />
              Repondre
            </button>
          )}

          {/* Reply input */}
          <AnimatePresence>
            {showReply && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 flex gap-2"
              >
                <input
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply()}
                  placeholder="Votre reponse..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                  maxLength={2000}
                />
                <button
                  onClick={handleReply}
                  disabled={sending || !replyContent.trim()}
                  className="px-3 py-1.5 bg-primary-500/20 text-primary-400 rounded-lg text-sm hover:bg-primary-500/30 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              ideaId={ideaId}
              onReplyAdded={onReplyAdded}
              isReply
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function IdeaComments({ ideaId }: Props) {
  const { t } = useLanguage();
  const [comments, setComments] = useState<IdeaCommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [type, setType] = useState("comment");
  const [sending, setSending] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erreur");
        return;
      }
      setContent("");
      setType("comment");
      fetchComments();
      toast.success("Commentaire publie !");
    } catch {
      toast.error("Erreur reseau");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary-400" />
        Discussion & contributions
        <span className="text-sm font-normal text-gray-500">({comments.length})</span>
      </h3>

      {/* Comment input */}
      <div className="mb-4 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Partagez une idee, une ressource, posez une question..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 resize-none"
          rows={3}
          maxLength={2000}
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {(["comment", "suggestion", "resource", "question"] as const).map((t) => {
              const cfg = typeConfig[t];
              const TypeIcon = cfg.icon;
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all ${
                    type === t
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <TypeIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">{cfg.label}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={handleSubmit}
            disabled={sending || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-400 disabled:opacity-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Publier
          </button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 text-sm">Chargement...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Aucun commentaire pour le moment. Soyez le premier a contribuer !
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              ideaId={ideaId}
              onReplyAdded={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
