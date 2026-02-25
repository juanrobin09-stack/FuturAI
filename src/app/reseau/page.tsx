"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Search, Loader2, Compass, Inbox } from "lucide-react";
import { useLanguage } from "@/i18n";
import PageTransition from "@/components/animations/PageTransition";
import FadeIn from "@/components/animations/FadeIn";
import UserCard from "@/components/UserCard";
import { motion } from "framer-motion";

type Tab = "connections" | "requests" | "discover";

interface ConnectionUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
  country?: string | null;
  points: number;
  bio?: string | null;
}

interface ConnectionData {
  connectionId: string;
  user: ConnectionUser;
  connectedAt: string;
}

interface PendingData {
  id: string;
  requesterId: string;
  receiverId: string;
  requester?: ConnectionUser;
  receiver?: ConnectionUser;
}

interface DiscoverUser extends ConnectionUser {
  connectionsCount: number;
  endorsementsCount: number;
  mutualConnections: number;
}

export default function ReseauPage() {
  const { t, locale } = useLanguage();
  const [tab, setTab] = useState<Tab>("connections");
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [pendingReceived, setPendingReceived] = useState<PendingData[]>([]);
  const [pendingSent, setPendingSent] = useState<PendingData[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout>>();

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/network/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
        setPendingReceived(data.pendingReceived || []);
        setPendingSent(data.pendingSent || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  const fetchDiscover = useCallback(async (q = "") => {
    setDiscoverLoading(true);
    try {
      const res = await fetch(`/api/network/discover${q ? `?search=${encodeURIComponent(q)}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setDiscoverUsers(data.users || []);
      }
    } catch {}
    setDiscoverLoading(false);
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    if (tab === "discover") fetchDiscover(search);
  }, [tab, fetchDiscover]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => fetchDiscover(value), 400));
  };

  const tabs = [
    { key: "connections" as Tab, label: t.network?.myConnections || "My Connections", icon: Users, count: connections.length },
    { key: "requests" as Tab, label: t.network?.requests || "Requests", icon: Inbox, count: pendingReceived.length },
    { key: "discover" as Tab, label: t.network?.discover || "Discover", icon: Compass },
  ];

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">{t.network?.title || "Network"}</span>
          </h1>
          <p className="text-gray-400 mt-2">
            {t.network?.subtitle || "Build your professional network and collaborate with innovators worldwide"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  t.key === "requests" && tab !== "requests"
                    ? "bg-accent-500 text-white"
                    : "bg-white/10 text-gray-400"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Connections Tab */}
            {tab === "connections" && (
              <FadeIn>
                {connections.length === 0 ? (
                  <div className="card text-center py-16">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400">
                      {t.network?.noConnections || "No connections yet"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">
                      {t.network?.discoverPeople || "Discover people to connect with"}
                    </p>
                    <button
                      onClick={() => setTab("discover")}
                      className="btn-primary mt-4 inline-flex items-center gap-2"
                    >
                      <Compass className="w-4 h-4" />
                      {t.network?.discover || "Discover"}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {connections.map((c) => (
                      <UserCard
                        key={c.connectionId}
                        user={c.user}
                        connectionStatus="connected"
                        connectionId={c.connectionId}
                        onConnectionChange={fetchConnections}
                      />
                    ))}
                  </div>
                )}
              </FadeIn>
            )}

            {/* Requests Tab */}
            {tab === "requests" && (
              <FadeIn>
                {pendingReceived.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                      <Inbox className="w-4 h-4 text-accent-400" />
                      {t.network?.receivedRequests || "Received requests"}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-500 text-white">{pendingReceived.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pendingReceived.map((p) => (
                        <UserCard
                          key={p.id}
                          user={p.requester!}
                          connectionStatus="pending_received"
                          connectionId={p.id}
                          onConnectionChange={fetchConnections}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {pendingSent.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-gray-500" />
                      {t.network?.sentRequests || "Sent requests"}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pendingSent.map((p) => (
                        <UserCard
                          key={p.id}
                          user={p.receiver!}
                          connectionStatus="pending_sent"
                          connectionId={p.id}
                          onConnectionChange={fetchConnections}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {pendingReceived.length === 0 && pendingSent.length === 0 && (
                  <div className="card text-center py-16">
                    <Inbox className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400">
                      {t.network?.noRequests || "No pending requests"}
                    </h3>
                  </div>
                )}
              </FadeIn>
            )}

            {/* Discover Tab */}
            {tab === "discover" && (
              <FadeIn>
                <div className="mb-6">
                  <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder={t.network?.searchUsers || "Search users..."}
                      className="input-field w-full pl-10"
                    />
                  </div>
                </div>

                {discoverLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
                  </div>
                ) : discoverUsers.length === 0 ? (
                  <div className="card text-center py-16">
                    <Compass className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400">
                      {t.common.noResults}
                    </h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {discoverUsers.map((u) => (
                      <UserCard
                        key={u.id}
                        user={u}
                        connectionStatus="none"
                        onConnectionChange={() => {
                          fetchConnections();
                          fetchDiscover(search);
                        }}
                      />
                    ))}
                  </div>
                )}
              </FadeIn>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
