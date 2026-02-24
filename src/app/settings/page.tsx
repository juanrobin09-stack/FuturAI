"use client";

import { useState, useEffect } from "react";
import { Settings, Key, Shield, Loader2, Trash2, Plus, Check, X } from "lucide-react";
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
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "mistral", label: "Mistral AI" },
  { value: "custom", label: "Custom" },
];

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

  const getProviderLabel = (provider: string) => {
    if (provider === "openai") return t.settings.openai;
    if (provider === "anthropic") return t.settings.anthropic;
    if (provider === "mistral") return t.settings.mistral || "Mistral AI";
    return t.settings.custom;
  };

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
                    {PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
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
                  return (
                    <div key={p.value} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${existing ? "bg-green-400" : "bg-gray-600"}`} />
                        <div>
                          <span className="text-sm font-medium">{p.label}</span>
                          {existing?.label && (
                            <span className="text-xs text-gray-500 ml-2">({existing.label})</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${existing ? "text-green-400" : "text-gray-500"}`}>
                          {existing ? t.settings.connected : t.settings.notConnected}
                        </span>
                        {existing && (
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
