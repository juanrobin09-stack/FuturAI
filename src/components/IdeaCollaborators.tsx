"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Code, Search, Palette, BookOpen, GraduationCap, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Collaborator {
  id: string;
  role: string;
  message: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    country: string | null;
  };
}

interface Props {
  ideaId: string;
  ideaAuthorId: string;
}

const roleConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> = {
  contributor: { icon: UserPlus, label: "Contributeur", color: "text-primary-400 bg-primary-400/10" },
  researcher: { icon: Search, label: "Chercheur", color: "text-blue-400 bg-blue-400/10" },
  developer: { icon: Code, label: "Développeur", color: "text-green-400 bg-green-400/10" },
  designer: { icon: Palette, label: "Designer", color: "text-purple-400 bg-purple-400/10" },
  mentor: { icon: GraduationCap, label: "Mentor", color: "text-amber-400 bg-amber-400/10" },
};

export default function IdeaCollaborators({ ideaId, ideaAuthorId }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState("contributor");
  const [message, setMessage] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const fetchCollaborators = async () => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}/collaborate`);
      const data = await res.json();
      setCollaborators(data.collaborators || []);
      setIsCollaborator(data.isCollaborator || false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/collaborate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success("Vous avez rejoint l'équipe ! +5 pts");
      setShowJoinForm(false);
      setMessage("");
      fetchCollaborators();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/collaborate`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Vous avez quitté l'équipe");
        fetchCollaborators();
      }
    } catch {
      toast.error("Erreur");
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-400" />
          Équipe
          <span className="text-sm font-normal text-gray-500">
            ({collaborators.length} collaborateur{collaborators.length !== 1 ? "s" : ""})
          </span>
        </h3>

        {!isCollaborator && !loading && (
          <button
            onClick={() => setShowJoinForm(!showJoinForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg text-sm font-medium hover:from-primary-400 hover:to-accent-400 transition-all shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Rejoindre
          </button>
        )}

        {isCollaborator && (
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="flex items-center gap-1 px-3 py-1.5 text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-lg text-xs transition-colors"
          >
            <X className="w-3 h-3" />
            Quitter
          </button>
        )}
      </div>

      {/* Join form */}
      <AnimatePresence>
        {showJoinForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
              <p className="text-sm text-gray-300">
                Choisissez votre rôle et présentez-vous :
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(roleConfig).map(([key, cfg]) => {
                  const RoleIcon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedRole(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                        selectedRole === key
                          ? `${cfg.color} border border-current/20 font-medium`
                          : "text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <RoleIcon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pourquoi voulez-vous contribuer ? (optionnel)"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 resize-none"
                rows={2}
                maxLength={500}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-400 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  {joining ? "..." : "Confirmer"}
                </button>
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collaborators list */}
      {loading ? (
        <div className="text-center py-4 text-gray-500 text-sm">Chargement...</div>
      ) : collaborators.length === 0 ? (
        <div className="text-center py-6">
          <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Personne n'a encore rejoint. Soyez le premier !
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {collaborators.map((collab) => {
            const cfg = roleConfig[collab.role] || roleConfig.contributor;
            const RoleIcon = cfg.icon;
            const initial = collab.user.username.charAt(0).toUpperCase();
            const isAuthor = collab.user.id === ideaAuthorId;

            return (
              <motion.div
                key={collab.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                {collab.user.avatarUrl ? (
                  <img
                    src={collab.user.avatarUrl}
                    alt={collab.user.username}
                    className="w-8 h-8 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {initial}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                      {collab.user.username}
                    </span>
                    {isAuthor && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                        Auteur
                      </span>
                    )}
                    <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${cfg.color}`}>
                      <RoleIcon className="w-2.5 h-2.5" />
                      {cfg.label}
                    </span>
                  </div>
                  {collab.message && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      &ldquo;{collab.message}&rdquo;
                    </p>
                  )}
                </div>
                {collab.user.country && (
                  <span className="text-xs text-gray-600 shrink-0">{collab.user.country}</span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
