"use client";

import { useState } from "react";
import { UserPlus, Check, Clock, Users, Star, Loader2 } from "lucide-react";
import { getLevelFromPoints } from "@/lib/points";
import { useLanguage } from "@/i18n";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface UserCardProps {
  user: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    country?: string | null;
    points: number;
    bio?: string | null;
    connectionsCount?: number;
    endorsementsCount?: number;
    mutualConnections?: number;
  };
  connectionStatus?: "none" | "pending_sent" | "pending_received" | "connected" | "self";
  connectionId?: string | null;
  onConnectionChange?: () => void;
}

export default function UserCard({ user, connectionStatus = "none", connectionId, onConnectionChange }: UserCardProps) {
  const { t } = useLanguage();
  const [status, setStatus] = useState(connectionStatus);
  const [loading, setLoading] = useState(false);
  const { level, title } = getLevelFromPoints(user.points, t.levels);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/network/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: user.id }),
      });
      if (res.ok) {
        setStatus("pending_sent");
        toast.success(t.network?.requestSent || "Connection request sent!");
        onConnectionChange?.();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error");
      }
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!connectionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/network/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (res.ok) {
        setStatus("connected");
        toast.success(t.network?.connectionAccepted || "Connection accepted!");
        onConnectionChange?.();
      }
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!connectionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/network/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      if (res.ok) {
        setStatus("none");
        onConnectionChange?.();
      }
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:border-white/10 transition-all group"
    >
      <div className="flex items-start gap-3">
        <Link href={`/profile/${user.id}`} className="shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-lg font-bold text-white group-hover:scale-105 transition-transform">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/profile/${user.id}`} className="hover:underline">
            <h3 className="font-semibold text-sm truncate">{user.username}</h3>
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-400">
              {t.common.level} {level} — {title}
            </span>
            {user.country && (
              <span className="text-[10px] text-gray-500">{user.country}</span>
            )}
          </div>
          {user.bio && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{user.bio}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
            {user.connectionsCount !== undefined && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {user.connectionsCount}
              </span>
            )}
            {user.endorsementsCount !== undefined && user.endorsementsCount > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {user.endorsementsCount}
              </span>
            )}
            {user.mutualConnections !== undefined && user.mutualConnections > 0 && (
              <span className="text-primary-400">
                {user.mutualConnections} {t.network?.mutual || "mutual"}
              </span>
            )}
          </div>
        </div>

        {/* Connection button */}
        <div className="shrink-0">
          {loading ? (
            <div className="w-8 h-8 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
            </div>
          ) : status === "none" ? (
            <button
              onClick={handleConnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-500/15 text-primary-400 hover:bg-primary-500/25 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {t.network?.connect || "Connect"}
            </button>
          ) : status === "pending_sent" ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 bg-white/5">
              <Clock className="w-3.5 h-3.5" />
              {t.network?.pending || "Pending"}
            </span>
          ) : status === "pending_received" ? (
            <div className="flex gap-1">
              <button
                onClick={handleAccept}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
              >
                {t.network?.accept || "Accept"}
              </button>
              <button
                onClick={handleDecline}
                className="px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                {t.network?.decline || "Decline"}
              </button>
            </div>
          ) : status === "connected" ? (
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-green-400 bg-green-500/10"
            >
              <Check className="w-3.5 h-3.5" />
              {t.network?.connected || "Connected"}
            </Link>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
