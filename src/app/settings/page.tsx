"use client";

import { useState, useEffect } from "react";
import { Settings, Key, Shield, Loader2, Trash2, Plus, Check, X, Code, Image, Film } from "lucide-react";
import { useLanguage } from "@/i18n";
import PageTransition from "@/components/animations/PageTransition";
import FadeIn from "@/components/animations/FadeIn";
import toast from "react-hot-toast";
import Link from "next/link";

interface ApiKeyData {
  id: string;
  provider: string;
  label: string | null;
  endpoint: string | null;
  connected: boolean;
}

const PROVIDERS = [
  { value: "openai", label: "OpenAI", desc: "GPT-4o, DALL-E 3", capabilities: ["code", "image"] },
  { value: "anthropic", label: "Anthropic", desc: "Claude Sonnet", capabilities: ["code"] },
  { value: "mistral", label: "Mistral AI", desc: "Mistral Small", capabilities: ["code"] },
  { value: "google", label: "Google Gemini", desc: "Gemini 2.0 Flash", capabilities: ["code"] },
  { value: "stability", label: "Stability AI", desc: "Stable Diffusion 3.5", capabilities: ["image"] },
  { value: "leonardo", label: "Leonardo AI", desc: "Leonardo Phoenix", capabilities: ["image"] },
  { value: "replicate", label: "Replicate", desc: "Flux, Video models", capabilities: ["image", "video"] },
  { value: "kling", label: "Kling AI", desc: "Kling Video", capabilities: ["video"] },
  { value: "midjourney", label: "Midjourney", desc: "Coming soon", capabilities: ["image"], disabled: true },
  { value: "custom", label: "Custom", desc: "OpenAI-compatible", capabilities: ["code", "image"] },
];

const CAPABILITY_STYLES: Record<string, { icon: typeof Code; color: string }> = {
  code: { icon: Code, color: "text-blue-400 bg-blue-400/10" },
  image: { icon: Image, color: "text-purple-400 bg-purple-400/10" },
  video: { icon: Film, color: "text-amber-400 bg-amber-400/10" },
};

export default function SettingsPage() {
  const { t } = useLanguage();
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);

  // Add key form
  const [showForm, setShowForm] = useState(false);
  const [formProvider, setFormProvider] = useState("openai");
  const [formKey, setFormKey] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formEndpoint, setFormEndpoint] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/user/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const saveKey = async () => {
    if (!formKey.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: formProvider,
          apiKey: formKey.trim(),
          label: formLabel.trim() || null,
          endpoint: formProvider === "custom" ? formEndpoint.trim() : null,
        }),
      });
      if (res.ok) {
        toast.success(t.settings.keySaved);
        setShowForm(false);
        setFormKey("");
        setFormLabel("");
        setFormEndpoint("");
        await fetchKeys();
      } else {
        toast.error(t.settings.keyError);
      }
    } catch {
      toast.error(t.settings.keyError);
    } finally {
      setSaving(false);
    }
  };

  const deleteKey = async (provider: string) => {
    try {
      const res = await fetch(`/api/user/api-keys?provider=${provider}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(t.settings.keyDeleted);
        await fetchKeys();
      }
    } catch {
      toast.error(t.common.error);
    }
  };

  // Only show connectable providers in the form dropdown
  const connectableProviders = PROVIDERS.filter((p) => !p.disabled);

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t.settings.title}</h1>
            <p className="text-sm text-gray-400">{t.settings.integrations}</p>
          </div>
        </div>

        {/* API Keys Section */}
        <FadeIn>
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Key className="w-5 h-5 text-accent-400" />
                {t.settings.integrations}
              </h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-accent text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t.settings.addApiKey}
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              {t.settings.encrypted}
            </p>

            {/* Add key form */}
            {showForm && (
              <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5 mb-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t.settings.provider}</label>
                  <select
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                    className="input-field w-full"
                  >
                    {connectableProviders.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label} — {p.desc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t.settings.apiKey}</label>
                  <input
                    type="password"
                    value={formKey}
                    onChange={(e) => setFormKey(e.target.value)}
                    placeholder="sk-..."
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t.settings.label}</label>
                  <input
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder={t.settings.labelPlaceholder}
                    className="input-field w-full"
                  />
                </div>
                {formProvider === "custom" && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t.settings.endpoint}</label>
                    <input
                      value={formEndpoint}
                      onChange={(e) => setFormEndpoint(e.target.value)}
                      placeholder={t.settings.endpointPlaceholder}
                      className="input-field w-full"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={saveKey}
                    disabled={saving || !formKey.trim()}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {saving ? t.settings.saving : t.settings.saveKey}
                  </button>
                  <button onClick={() => setShowForm(false)} className="btn-ghost px-4">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Keys list */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {PROVIDERS.map((p) => {
                  const existing = keys.find((k) => k.provider === p.value);
                  const isDisabled = p.disabled;
                  return (
                    <div
                      key={p.value}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isDisabled
                          ? "bg-gray-800/10 border-white/3 opacity-50"
                          : "bg-gray-800/30 border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          isDisabled ? "bg-gray-700" : existing ? "bg-green-400" : "bg-gray-600"
                        }`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{p.label}</span>
                            {p.capabilities.map((cap) => {
                              const style = CAPABILITY_STYLES[cap];
                              if (!style) return null;
                              const Icon = style.icon;
                              return (
                                <span key={cap} className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${style.color}`}>
                                  <Icon className="w-2.5 h-2.5" />
                                  {cap === "code" ? "Code" : cap === "image" ? "Image" : "Video"}
                                </span>
                              );
                            })}
                          </div>
                          <span className="text-xs text-gray-500">{p.desc}</span>
                          {existing?.label && (
                            <span className="text-xs text-gray-500 ml-1">• {existing.label}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs ${
                          isDisabled ? "text-gray-600 italic" : existing ? "text-green-400" : "text-gray-500"
                        }`}>
                          {isDisabled
                            ? (t.settings.comingSoon || "Coming soon")
                            : existing
                            ? t.settings.connected
                            : t.settings.notConnected}
                        </span>
                        {existing && !isDisabled && (
                          <button
                            onClick={() => deleteKey(p.value)}
                            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                            title={t.settings.deleteKey}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </FadeIn>

        {/* Data & Privacy Section */}
        <FadeIn>
          <div className="card">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary-400" />
              {t.settings.dataPrivacy}
            </h2>
            <div className="space-y-3">
              <Link
                href="/data"
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-white/5 hover:border-primary-500/20 transition-all"
              >
                <span className="text-sm">{t.settings.exportData}</span>
                <span className="text-xs text-gray-500">&rarr;</span>
              </Link>
              <Link
                href="/privacy"
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-white/5 hover:border-primary-500/20 transition-all"
              >
                <span className="text-sm">{t.consent.privacyLink}</span>
                <span className="text-xs text-gray-500">&rarr;</span>
              </Link>
              <Link
                href="/terms"
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-white/5 hover:border-primary-500/20 transition-all"
              >
                <span className="text-sm">{t.consent.termsLink}</span>
                <span className="text-xs text-gray-500">&rarr;</span>
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
