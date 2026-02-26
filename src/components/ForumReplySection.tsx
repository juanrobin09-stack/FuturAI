"use client";

import { useState, useTransition } from "react";
import { Send, MessageSquare, Reply, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n";
import { timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

interface PostAuthor {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

interface ForumPost {
  id: string;
  content: string;
  createdAt: string | Date;
  author: PostAuthor;
  replies: ForumPost[];
}

interface ForumReplySectionProps {
  threadId: string;
  initialPosts: ForumPost[];
  isLocked: boolean;
}

export default function ForumReplySection({
  threadId,
  initialPosts,
  isLocked,
}: ForumReplySectionProps) {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<ForumPost[]>(initialPosts);
  const [newReply, setNewReply] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();

  const totalCount = posts.reduce(
    (acc, post) => acc + 1 + (post.replies?.length ?? 0),
    0
  );

  const handleSubmit = (parentId?: string) => {
    const text = parentId ? replyText : newReply;
    if (!text.trim() || isLocked) return;

    const optimisticPost: ForumPost = {
      id: `temp-${Date.now()}`,
      content: text.trim(),
      createdAt: new Date().toISOString(),
      author: { id: "me", username: "You", avatarUrl: null },
      replies: [],
    };

    // Optimistic UI update
    if (parentId) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === parentId
            ? { ...post, replies: [...(post.replies || []), optimisticPost] }
            : post
        )
      );
      setReplyText("");
      setReplyTo(null);
    } else {
      setPosts((prev) => [...prev, optimisticPost]);
      setNewReply("");
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/forum/${threadId}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text.trim(), parentId }),
        });

        if (!res.ok) throw new Error("Failed");

        const savedPost: ForumPost = await res.json();

        // Replace optimistic entry with server response
        if (parentId) {
          setPosts((prev) =>
            prev.map((post) =>
              post.id === parentId
                ? {
                    ...post,
                    replies: (post.replies || []).map((r) =>
                      r.id === optimisticPost.id ? savedPost : r
                    ),
                  }
                : post
            )
          );
        } else {
          setPosts((prev) =>
            prev.map((p) => (p.id === optimisticPost.id ? savedPost : p))
          );
        }

        toast.success(t.forum.replyAdded);
      } catch {
        // Revert optimistic update on error
        if (parentId) {
          setPosts((prev) =>
            prev.map((post) =>
              post.id === parentId
                ? {
                    ...post,
                    replies: (post.replies || []).filter(
                      (r) => r.id !== optimisticPost.id
                    ),
                  }
                : post
            )
          );
        } else {
          setPosts((prev) =>
            prev.filter((p) => p.id !== optimisticPost.id)
          );
        }
        toast.error(t.forum.errorMessage);
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary-400" />
        {t.forum.replies} ({totalCount})
      </h3>

      {/* Reply input at top */}
      {!isLocked && (
        <div className="flex gap-2">
          <textarea
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder={t.forum.replyPlaceholder}
            className="input-field flex-1 min-h-[48px] resize-y"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={isPending || !newReply.trim()}
            className="btn-primary shrink-0 px-4 self-end"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Posts list */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="group">
            <div className="bg-gray-800/30 rounded-xl p-4 border border-white/5">
              {/* Post author row */}
              <div className="flex items-center gap-2 mb-3">
                {post.author.avatarUrl ? (
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.username}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-500/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-primary-500/30">
                    {post.author.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-200">
                  {post.author.username}
                </span>
                <span className="text-xs text-gray-500">
                  {timeAgo(post.createdAt, t.time)}
                </span>
              </div>

              {/* Post content */}
              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Reply button */}
              {!isLocked && (
                <button
                  onClick={() =>
                    setReplyTo(replyTo === post.id ? null : post.id)
                  }
                  className="text-sm text-gray-500 hover:text-primary-400 mt-3 flex items-center gap-1 transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  {t.forum.reply}
                </button>
              )}

              {/* Nested reply input */}
              {replyTo === post.id && (
                <div className="flex gap-2 mt-3 ml-3 sm:ml-8 border-l-2 border-white/5 pl-2 sm:pl-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={t.forum.replyPlaceholder}
                    className="input-field flex-1 text-sm py-2 min-h-[40px] resize-y"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(post.id);
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSubmit(post.id)}
                    disabled={isPending || !replyText.trim()}
                    className="btn-primary px-3 py-2 text-sm self-end"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Nested replies */}
              {post.replies && post.replies.length > 0 && (
                <div className="mt-4 ml-3 sm:ml-8 border-l-2 border-white/5 space-y-3 pl-2 sm:pl-4">
                  {post.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="bg-gray-800/20 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {reply.author.avatarUrl ? (
                          <img
                            src={reply.author.avatarUrl}
                            alt={reply.author.username}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-primary-500/20"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-primary-500/20">
                            {reply.author.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-medium text-gray-300">
                          {reply.author.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {timeAgo(reply.createdAt, t.time)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {posts.length === 0 && (
          <div className="text-center py-10">
            <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{t.forum.noReplies}</p>
          </div>
        )}
      </div>
    </div>
  );
}
