"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Send, Loader2, X, Users, ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n";
import { timeAgo } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; avatarUrl?: string | null };
}

interface SessionChatProps {
  sessionId: string;
  participants: Array<{
    id: string;
    user: { id: string; username: string; avatarUrl?: string | null };
  }>;
}

const POLL_INTERVAL = 5000;

export default function SessionChat({ sessionId, participants }: SessionChatProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  // Get current user
  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => setCurrentUserId(d.id || null))
      .catch(() => {});
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/sandbox/sessions/${sessionId}/comments`);
      if (res.ok) {
        const data = await res.json();
        const msgs: ChatMessage[] = data.comments || [];
        setMessages(msgs);

        // Track unread when closed
        if (!open && msgs.length > lastCountRef.current) {
          setUnread((prev) => prev + (msgs.length - lastCountRef.current));
        }
        lastCountRef.current = msgs.length;
      }
    } catch {}
  }, [sessionId, open]);

  // Initial fetch + polling
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Clear unread when opened
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`/api/sandbox/sessions/${sessionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        lastCountRef.current++;
      }
    } catch {} finally {
      setSending(false);
    }
  };

  // Determine "active" users — those who sent a message in the last 5 minutes
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const activeUserIds = new Set(
    messages
      .filter((m) => new Date(m.createdAt).getTime() > fiveMinAgo)
      .map((m) => m.user.id)
  );

  const isOwnMessage = (msg: ChatMessage) => msg.user.id === currentUserId;

  return (
    <>
      {/* Floating chat button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-xl flex items-center justify-center hover:shadow-primary-500/30 transition-shadow"
          >
            <MessageCircle className="w-6 h-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl bg-[#1e1e2e] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "min(500px, calc(100vh - 6rem))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#181825] border-b border-white/5">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-semibold">Chat d&apos;equipe</span>
                <span className="text-[10px] text-gray-500">({messages.length})</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Online indicators */}
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-gray-500" />
                  <div className="flex -space-x-1">
                    {participants.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="relative"
                        title={p.user.username}
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[8px] font-bold text-white border border-[#181825]">
                          {p.user.username.charAt(0).toUpperCase()}
                        </div>
                        {activeUserIds.has(p.user.id) && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-[#181825]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 text-gray-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2" style={{ minHeight: "200px" }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 py-10">
                  <MessageCircle className="w-8 h-8 mb-2" />
                  <p className="text-xs">Coordonnez-vous avec votre equipe ici</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const own = isOwnMessage(msg);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${own ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex items-end gap-1.5 max-w-[80%] ${own ? "flex-row-reverse" : ""}`}>
                        {!own && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                            {msg.user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          {!own && (
                            <span className="text-[10px] text-gray-500 ml-1 block mb-0.5">
                              {msg.user.username}
                            </span>
                          )}
                          <div
                            className={`px-3 py-1.5 rounded-2xl text-sm ${
                              own
                                ? "bg-primary-500/20 text-primary-200 rounded-br-sm"
                                : "bg-[#313244] text-gray-200 rounded-bl-sm"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className={`text-[9px] text-gray-600 mt-0.5 block ${own ? "text-right mr-1" : "ml-1"}`}>
                            {timeAgo(msg.createdAt, t.time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5 bg-[#181825]">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Message..."
                  className="flex-1 bg-[#313244] text-sm text-white px-3 py-2 rounded-xl border border-white/5 focus:border-primary-500/30 focus:outline-none placeholder:text-gray-600"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="w-9 h-9 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center hover:bg-primary-500/30 transition-colors disabled:opacity-30"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
