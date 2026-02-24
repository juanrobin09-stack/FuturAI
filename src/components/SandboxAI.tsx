"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Wand2, Code, Image, Loader2, Settings } from "lucide-react";
import { useLanguage } from "@/i18n";
import toast from "react-hot-toast";
import Link from "next/link";

type SandboxMode = "text-to-image" | "text-to-code" | "text-to-video";

interface SandboxAIProps {
  ideaId?: string;
  ideaTitle?: string;
}

interface ProviderInfo {
  name: string;
  connected: boolean;
}

export default function SandboxAI({ ideaId, ideaTitle }: SandboxAIProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<SandboxMode>("text-to-code");
  const [prompt, setPrompt] = useState(
    ideaTitle ? t.arena.generatePrototype.replace("{title}", ideaTitle) : ""
  );
  const [result, setResult] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Provider state
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [providersLoaded, setProvidersLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/arena/providers")
      .then((r) => r.json())
      .then((data) => {
        const list: ProviderInfo[] = data.providers || [];
        setProviders(list);
        const connected = list.find((p) => p.connected);
        if (connected) setSelectedProvider(connected.name);
      })
      .catch(() => {})
      .finally(() => setProvidersLoaded(true));
  }, []);

  const modes = [
    { key: "text-to-code" as const, label: t.arena.codeAI, icon: Code },
    { key: "text-to-image" as const, label: t.arena.textToImage, icon: Image },
    { key: "text-to-video" as const, label: t.arena.textToVideo, icon: Wand2 },
  ];

  const connectedProviders = providers.filter((p) => p.connected);
  const hasProvider = connectedProviders.length > 0;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t.arena.enterPrompt);
      return;
    }

    setLoading(true);
    setResult("");
    setResultUrl(null);

    try {
      if (!hasProvider || !selectedProvider) {
        // No provider connected — show helpful message
        await new Promise((r) => setTimeout(r, 500));
        setResult(
          t.arena.connectApiPrompt ||
          "Connect your API key in Settings > Integrations to use real AI generation."
        );
        setLoading(false);
        return;
      }

      const res = await fetch("/api/arena/execute-quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          provider: selectedProvider,
          mode,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setResult(data.result || "");
        setResultUrl(data.resultUrl || null);
        toast.success(`${t.arena.generationComplete} (${data.provider})`);

        // Save to idea if linked
        if (ideaId) {
          await fetch("/api/ideas/" + ideaId, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sandboxResult: { type: mode, prompt, resultText: data.result, resultUrl: data.resultUrl },
            }),
          }).catch(() => {});
        }
      } else {
        if (data.error === "no_api_key") {
          setResult(
            t.arena.connectApiPrompt ||
            "Connect your API key in Settings > Integrations."
          );
        } else {
          toast.error(data.error || t.arena.generationError);
        }
      }
    } catch {
      toast.error(t.arena.generationError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical className="w-5 h-5 text-accent-400" />
        <h3 className="text-lg font-semibold">{t.arena.title}</h3>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 flex-wrap">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m.key
                ? "bg-accent-500/20 text-accent-400 border border-accent-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <m.icon className="w-4 h-4" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Provider selector */}
      {providersLoaded && (
        <div className="flex items-center gap-2 flex-wrap">
          {hasProvider ? (
            <>
              <span className="text-xs text-gray-500">{t.settings.provider}:</span>
              {connectedProviders.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSelectedProvider(p.name)}
                  className={`text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all ${
                    selectedProvider === p.name
                      ? "bg-primary-500/15 text-primary-400 border border-primary-500/30"
                      : "bg-gray-800 text-gray-300 border border-white/5 hover:border-white/10"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  {p.name}
                </button>
              ))}
            </>
          ) : (
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-xs text-accent-400 hover:text-accent-300 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              {t.arena.connectApiPrompt || "Connect an API key in Settings"}
            </Link>
          )}
        </div>
      )}

      {/* Prompt input */}
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t.arena.promptPlaceholder}
          className="input-field flex-1"
          onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-accent shrink-0 flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          {t.arena.generate}
        </button>
      </div>

      {/* Result */}
      {(result || resultUrl) && (
        <div className="bg-gray-800/80 rounded-xl p-4 border border-white/5">
          {resultUrl && mode === "text-to-image" ? (
            <div className="space-y-3">
              <img
                src={resultUrl}
                alt={`Generated: ${prompt}`}
                className="w-full rounded-lg max-h-[512px] object-contain"
              />
              <p className="text-xs text-gray-500">{result}</p>
            </div>
          ) : resultUrl && mode === "text-to-video" ? (
            <div className="space-y-3">
              <video
                src={resultUrl}
                controls
                className="w-full rounded-lg max-h-[512px]"
              />
              <p className="text-xs text-gray-500">{result}</p>
            </div>
          ) : (
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
              {result}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
