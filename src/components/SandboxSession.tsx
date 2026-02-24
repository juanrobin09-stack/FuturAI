"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Plus, Code, Image, Wand2, Loader2, Share2, Copy, Users, Globe, Lock, ArrowLeft, Download, FileText, GitCompare, Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/i18n";
import toast from "react-hot-toast";
import SandboxVersionTimeline from "./SandboxVersionTimeline";
import SandboxComments from "./SandboxComments";
import VersionDiffView from "./VersionDiffView";
import ContributorTimeline from "./ContributorTimeline";

type SandboxMode = "text-to-image" | "text-to-code" | "text-to-video";

interface SessionData {
  id: string;
  name: string;
  description?: string | null;
  problemStatement?: string | null;
  proposedImpact?: string | null;
  documentation?: string | null;
  type: string;
  isPublic: boolean;
  shareSlug?: string | null;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; username: string; avatarUrl?: string | null };
  participants: Array<{
    id: string;
    role: string;
    user: { id: string; username: string; avatarUrl?: string | null };
  }>;
  versions: Array<{
    id: string;
    version: number;
    prompt: string;
    resultText?: string | null;
    resultUrl?: string | null;
    changelog?: string | null;
    createdAt: string;
    author: { id: string; username: string; avatarUrl?: string | null };
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; username: string; avatarUrl?: string | null };
  }>;
  _count?: { versions: number; comments: number };
}

export default function SandboxSession() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<SandboxMode>("text-to-code");
  const [newDesc, setNewDesc] = useState("");
  const [newProblem, setNewProblem] = useState("");
  const [newImpact, setNewImpact] = useState("");

  // Generate form
  const [prompt, setPrompt] = useState("");
  const [changelog, setChangelog] = useState("");
  const [activeVersionId, setActiveVersionId] = useState<string | undefined>();
  const [viewingResult, setViewingResult] = useState("");

  // V6.3: Arena enhancements
  const [activeTab, setActiveTab] = useState<"editor" | "docs" | "diff" | "timeline">("editor");
  const [documentation, setDocumentation] = useState("");
  const [savingDocs, setSavingDocs] = useState(false);
  const [diffVersionA, setDiffVersionA] = useState("");
  const [diffVersionB, setDiffVersionB] = useState("");

  // V7: Real execution
  const [providers, setProviders] = useState<Array<{ name: string; connected: boolean; status: string }>>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [executionError, setExecutionError] = useState("");

  const modes = [
    { key: "text-to-code" as const, label: t.arena.codeAI, icon: Code },
    { key: "text-to-image" as const, label: t.arena.textToImage, icon: Image },
    { key: "text-to-video" as const, label: t.arena.textToVideo, icon: Wand2 },
  ];

  useEffect(() => {
    fetchSessions();
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/arena/providers");
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
        const connected = (data.providers || []).find((p: { connected: boolean }) => p.connected);
        if (connected) setSelectedProvider(connected.name);
      }
    } catch {}
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sandbox/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const openSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sandbox/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
        setDocumentation(data.documentation || "");
        if (data.versions?.length > 0) {
          const latest = data.versions[0];
          setActiveVersionId(latest.id);
          setViewingResult(latest.resultText || "");
          setPrompt(latest.prompt || "");
        }
      }
    } catch {
      toast.error(t.common.error);
    }
  };

  const createSession = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/sandbox/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          type: newType,
          description: newDesc.trim() || null,
          problemStatement: newProblem.trim() || null,
          proposedImpact: newImpact.trim() || null,
        }),
      });
      if (res.ok) {
        const session = await res.json();
        toast.success(t.arenaSession.sessionCreated);
        setShowCreate(false);
        setNewName("");
        setNewDesc("");
        setNewProblem("");
        setNewImpact("");
        await fetchSessions();
        await openSession(session.id);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setCreating(false);
    }
  };

  const generateVersion = async () => {
    if (!prompt.trim() || !activeSession || generating) return;
    setGenerating(true);
    setExecutionError("");

    const connectedProviders = providers.filter((p) => p.connected);

    // If no provider connected, use fallback mode
    if (connectedProviders.length === 0 || !selectedProvider) {
      try {
        // Save version via legacy API (no AI execution, saves prompt only)
        const res = await fetch(`/api/sandbox/sessions/${activeSession.id}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
            resultText: `[No API key connected]\n\nPrompt: "${prompt.trim()}"\nMode: ${activeSession.type}\n\nConnect your API key in Settings to enable real AI execution.\nSupported: OpenAI, Anthropic, Mistral, Custom endpoint.`,
            changelog: changelog.trim() || null,
          }),
        });
        if (res.ok) {
          setChangelog("");
          toast.success(t.arena.generationComplete);
          await openSession(activeSession.id);
        }
      } catch {
        toast.error(t.arena.generationError);
      } finally {
        setGenerating(false);
      }
      return;
    }

    // Real AI execution via /api/arena/execute
    try {
      const res = await fetch("/api/arena/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          prompt: prompt.trim(),
          changelog: changelog.trim() || null,
          provider: selectedProvider,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setViewingResult(data.version?.resultText || "");
        setChangelog("");
        toast.success(`${t.arena.generationComplete} (${data.provider}, ${data.durationMs}ms)`);
        await openSession(activeSession.id);
      } else {
        const errMsg = data.error === "no_api_key"
          ? "No API key configured for this provider. Go to Settings to add one."
          : data.error || "Execution failed";
        setExecutionError(errMsg);
        toast.error(errMsg);
      }
    } catch {
      toast.error(t.arena.generationError);
    } finally {
      setGenerating(false);
    }
  };

  const togglePublic = async () => {
    if (!activeSession) return;
    const newIsPublic = !activeSession.isPublic;
    const slug = newIsPublic && !activeSession.shareSlug
      ? activeSession.id.slice(0, 8) + "-" + Date.now().toString(36)
      : activeSession.shareSlug;

    try {
      await fetch(`/api/sandbox/sessions/${activeSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: newIsPublic, shareSlug: slug }),
      });
      setActiveSession({ ...activeSession, isPublic: newIsPublic, shareSlug: slug });
      toast.success(newIsPublic ? t.arenaSession.publicSession : t.arenaSession.privateSession);
    } catch {
      // Ignore
    }
  };

  const saveDocumentation = async () => {
    if (!activeSession || savingDocs) return;
    setSavingDocs(true);
    try {
      await fetch(`/api/sandbox/sessions/${activeSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentation: documentation.trim() }),
      });
      toast.success(t.arenaEnhanced.documentationSaved);
    } catch {
      toast.error(t.common.error);
    } finally {
      setSavingDocs(false);
    }
  };

  const copyShareLink = () => {
    if (activeSession?.shareSlug) {
      const url = `${window.location.origin}/arena/${activeSession.shareSlug}`;
      navigator.clipboard.writeText(url);
      toast.success(t.arenaSession.linkCopied);
    }
  };

  // ─── Session List View ───
  if (!activeSession) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-accent-400" />
            {t.arenaSession.mySessions}
          </h3>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-accent text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t.arenaSession.createSession}
          </button>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="card space-y-3 overflow-hidden"
            >
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t.arenaSession.sessionNamePlaceholder}
                className="input-field w-full"
              />
              <div className="flex gap-2">
                {modes.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setNewType(m.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      newType === m.key
                        ? "bg-accent-500/20 text-accent-400 border border-accent-500/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <m.icon className="w-4 h-4" />
                    {m.label}
                  </button>
                ))}
              </div>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder={t.arenaSession.sessionDescriptionPlaceholder}
                className="input-field w-full"
                rows={2}
              />
              <input
                value={newProblem}
                onChange={(e) => setNewProblem(e.target.value)}
                placeholder={t.arenaSession.problemStatementPlaceholder}
                className="input-field w-full"
              />
              <input
                value={newImpact}
                onChange={(e) => setNewImpact(e.target.value)}
                placeholder={t.arenaSession.proposedImpactPlaceholder}
                className="input-field w-full"
              />
              <button onClick={createSession} disabled={creating || !newName.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? "..." : t.arenaSession.createSession}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((session) => (
              <motion.button
                key={session.id}
                whileHover={{ y: -2 }}
                onClick={() => openSession(session.id)}
                className="card w-full text-left flex items-center gap-4 hover:border-primary-500/20 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center shrink-0">
                  {session.type === "text-to-code" ? (
                    <Code className="w-5 h-5 text-primary-400" />
                  ) : session.type === "text-to-image" ? (
                    <Image className="w-5 h-5 text-accent-400" />
                  ) : (
                    <Wand2 className="w-5 h-5 text-purple-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{session.name}</span>
                    {session.isPublic ? (
                      <Globe className="w-3 h-3 text-green-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-gray-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span>{session._count?.versions || session.versions?.length || 0} versions</span>
                    <span>{session.participants?.length || 0} {t.arenaSession.participants.toLowerCase()}</span>
                  </div>
                </div>
                {/* Participant avatars */}
                <div className="flex -space-x-1.5">
                  {session.participants?.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[9px] font-bold text-white border border-gray-900"
                      title={p.user.username}
                    >
                      {p.user.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="card text-center py-10">
            <FlaskConical className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{t.arenaSession.noSessions}</p>
          </div>
        )}
      </div>
    );
  }

  // ─── Active Session View ───
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveSession(null)} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-semibold">{activeSession.name}</h3>
            <p className="text-xs text-gray-500">{activeSession.description}</p>
            {activeSession.problemStatement && (
              <p className="text-xs text-gray-400 mt-1">
                <span className="text-primary-400 font-medium">{t.arenaSession.problemStatement}:</span> {activeSession.problemStatement}
              </p>
            )}
            {activeSession.proposedImpact && (
              <p className="text-xs text-gray-400 mt-0.5">
                <span className="text-accent-400 font-medium">{t.arenaSession.proposedImpact}:</span> {activeSession.proposedImpact}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Participant avatars */}
          <div className="flex -space-x-1.5 mr-2">
            {activeSession.participants?.map((p) => (
              <div
                key={p.id}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-gray-900"
                title={p.user.username}
              >
                {p.user.username.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>

          {/* Share controls */}
          <button
            onClick={togglePublic}
            className={`p-2 rounded-lg text-xs transition-all ${
              activeSession.isPublic
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-gray-800 text-gray-400 border border-white/5"
            }`}
            title={activeSession.isPublic ? t.arenaSession.publicSession : t.arenaSession.privateSession}
          >
            {activeSession.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>

          {activeSession.isPublic && activeSession.shareSlug && (
            <button onClick={copyShareLink} className="btn-ghost text-xs flex items-center gap-1">
              <Copy className="w-3.5 h-3.5" />
              {t.arenaSession.shareSession}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-800/50 rounded-lg">
        {[
          { key: "editor" as const, label: t.arena.codeEditor, icon: Code },
          { key: "docs" as const, label: t.arenaEnhanced.documentation, icon: FileText },
          { key: "diff" as const, label: t.arenaEnhanced.compareVersions, icon: GitCompare },
          { key: "timeline" as const, label: t.arenaEnhanced.contributorTimeline, icon: Clock },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-primary-500/15 text-primary-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
        {/* Main area */}
        <div className="space-y-4">
          {/* Editor Tab */}
          {activeTab === "editor" && <>
          {/* Provider Status Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {providers.length > 0 ? (
              <>
                <span className="text-xs text-gray-500">Provider:</span>
                {providers.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => p.connected && setSelectedProvider(p.name)}
                    className={`text-xs px-2 py-1 rounded-md flex items-center gap-1.5 transition-all ${
                      selectedProvider === p.name
                        ? "bg-primary-500/15 text-primary-400 border border-primary-500/30"
                        : p.connected
                        ? "bg-gray-800 text-gray-300 border border-white/5 hover:border-white/10"
                        : "bg-gray-800/50 text-gray-600 border border-white/5 cursor-not-allowed"
                    }`}
                    disabled={!p.connected}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${p.connected ? "bg-green-400" : "bg-gray-600"}`} />
                    {p.name}
                  </button>
                ))}
              </>
            ) : (
              <a href="/settings" className="text-xs text-accent-400 hover:text-accent-300 transition-colors">
                Connect an API key in Settings →
              </a>
            )}
          </div>

          {/* Execution Error */}
          {executionError && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {executionError}
            </div>
          )}

          {/* Prompt + Generate */}
          <div className="card space-y-3">
            <div className="flex gap-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.arena.promptPlaceholder}
                className="input-field flex-1"
                onKeyDown={(e) => e.key === "Enter" && generateVersion()}
              />
              <button
                onClick={generateVersion}
                disabled={generating}
                className="btn-accent shrink-0 flex items-center gap-2"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {t.arena.generate}
              </button>
            </div>
            <input
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder={t.arenaSession.changelogPlaceholder}
              className="input-field w-full text-sm"
            />
          </div>

          {/* Result display */}
          {viewingResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/80 rounded-xl p-4 border border-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">
                  {activeVersionId && activeSession.versions?.find((v) => v.id === activeVersionId)
                    ? `v${activeSession.versions.find((v) => v.id === activeVersionId)?.version}`
                    : "Result"}
                </span>
                <button className="btn-ghost text-xs flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {t.export.exportResult}
                </button>
              </div>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto max-h-96">
                {viewingResult}
              </pre>
            </motion.div>
          )}

          {/* Comments */}
          <SandboxComments sessionId={activeSession.id} initialComments={activeSession.comments || []} />
          </>}

          {/* Documentation Tab */}
          {activeTab === "docs" && (
            <div className="card space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-400" />
                {t.arenaEnhanced.documentation}
              </h3>
              <textarea
                value={documentation}
                onChange={(e) => setDocumentation(e.target.value)}
                placeholder={t.arenaEnhanced.documentationPlaceholder}
                className="input-field w-full min-h-[300px] resize-y font-mono text-sm"
              />
              <button
                onClick={saveDocumentation}
                disabled={savingDocs}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {savingDocs ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t.arenaEnhanced.saveDocumentation}
              </button>
            </div>
          )}

          {/* Diff Tab */}
          {activeTab === "diff" && (
            <div className="card space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-accent-400" />
                {t.arenaEnhanced.compareVersions}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t.arenaEnhanced.selectVersionA}</label>
                  <select
                    value={diffVersionA}
                    onChange={(e) => setDiffVersionA(e.target.value)}
                    className="input-field w-full text-sm"
                  >
                    <option value="">--</option>
                    {activeSession.versions?.map((v) => (
                      <option key={v.id} value={v.id}>v{v.version} - {v.author.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t.arenaEnhanced.selectVersionB}</label>
                  <select
                    value={diffVersionB}
                    onChange={(e) => setDiffVersionB(e.target.value)}
                    className="input-field w-full text-sm"
                  >
                    <option value="">--</option>
                    {activeSession.versions?.map((v) => (
                      <option key={v.id} value={v.id}>v{v.version} - {v.author.username}</option>
                    ))}
                  </select>
                </div>
              </div>
              {diffVersionA && diffVersionB && (
                <VersionDiffView
                  textA={activeSession.versions?.find((v) => v.id === diffVersionA)?.resultText || ""}
                  textB={activeSession.versions?.find((v) => v.id === diffVersionB)?.resultText || ""}
                  labelA={`v${activeSession.versions?.find((v) => v.id === diffVersionA)?.version || "?"}`}
                  labelB={`v${activeSession.versions?.find((v) => v.id === diffVersionB)?.version || "?"}`}
                />
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <div className="card space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-400" />
                {t.arenaEnhanced.contributorTimeline}
              </h3>
              <ContributorTimeline versions={activeSession.versions || []} />
            </div>
          )}
        </div>

        {/* Sidebar — Version Timeline */}
        <div className="space-y-4">
          <div className="card">
            <SandboxVersionTimeline
              versions={activeSession.versions || []}
              activeVersionId={activeVersionId}
              onSelectVersion={(v) => {
                setActiveVersionId(v.id);
                setViewingResult(v.resultText || "");
                setPrompt(v.prompt);
              }}
            />
          </div>

          {/* Quick stats */}
          <div className="card text-xs space-y-2">
            <div className="flex justify-between text-gray-400">
              <span>Type</span>
              <span className="text-white">{activeSession.type.replace("text-to-", "")}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span><Users className="w-3 h-3 inline mr-1" />{t.arenaSession.participants}</span>
              <span className="text-white">{activeSession.participants?.length || 0}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>{t.arenaSession.versionHistory}</span>
              <span className="text-white">{activeSession.versions?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
