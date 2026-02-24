"use client";

import { useState } from "react";
import { FlaskConical, Wand2, Code, Image, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n";
import toast from "react-hot-toast";

type SandboxMode = "text-to-image" | "text-to-code" | "text-to-video";

interface SandboxAIProps {
  ideaId?: string;
  ideaTitle?: string;
}

export default function SandboxAI({ ideaId, ideaTitle }: SandboxAIProps) {
  const { t, locale } = useLanguage();
  const [mode, setMode] = useState<SandboxMode>("text-to-code");
  const [prompt, setPrompt] = useState(
    ideaTitle ? t.arena.generatePrototype.replace("{title}", ideaTitle) : ""
  );
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const modes = [
    { key: "text-to-code" as const, label: t.arena.codeAI, icon: Code },
    { key: "text-to-image" as const, label: t.arena.textToImage, icon: Image },
    { key: "text-to-video" as const, label: t.arena.textToVideo, icon: Wand2 },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t.arena.enterPrompt);
      return;
    }

    setLoading(true);
    setResult("");

    try {
      await new Promise((r) => setTimeout(r, 2000));

      if (mode === "text-to-code") {
        setResult(`// AI Prototype generated for: "${prompt}"
// ------------------------------------------

import { pipeline } from '@huggingface/transformers';

class AIPrototype {
  private model: any;

  async initialize() {
    console.log('Initializing AI model...');
    this.model = await pipeline('text-generation', 'gpt2');
    console.log('Model ready!');
  }

  async generate(input: string): Promise<string> {
    const result = await this.model(input, {
      max_length: 200,
      temperature: 0.7,
      top_p: 0.9,
    });
    return result[0].generated_text;
  }

  async evaluate(testCases: string[]): Promise<void> {
    console.log('Evaluating on', testCases.length, 'test cases...');
    for (const testCase of testCases) {
      const output = await this.generate(testCase);
      console.log('Input:', testCase);
      console.log('Output:', output);
      console.log('---');
    }
  }
}

async function main() {
  const proto = new AIPrototype();
  await proto.initialize();

  const result = await proto.generate("${prompt}");
  console.log('Result:', result);
}

main().catch(console.error);`);
      } else if (mode === "text-to-image") {
        setResult(
          `[Image Generation Preview]\n\nPrompt: "${prompt}"\n` +
          (locale === "fr"
            ? `Modele: Stable Diffusion XL\nResolution: 1024x1024\nSteps: 30\nCFG Scale: 7.5\n\nPour generer de vraies images, connectez votre cle API dans Parametres > Integrations.`
            : `Model: Stable Diffusion XL\nResolution: 1024x1024\nSteps: 30\nCFG Scale: 7.5\n\nTo generate real images, connect your API key in Settings > Integrations.`)
        );
      } else {
        setResult(
          `[Video Generation Preview]\n\nPrompt: "${prompt}"\n` +
          (locale === "fr"
            ? `Modele: Runway Gen-2 / Pika Labs\nDuree: 4 secondes\nResolution: 720p\n\nPour generer de vraies videos, connectez votre cle API dans Parametres > Integrations.`
            : `Model: Runway Gen-2 / Pika Labs\nDuration: 4 seconds\nResolution: 720p\n\nTo generate real videos, connect your API key in Settings > Integrations.`)
        );
      }

      if (ideaId) {
        await fetch("/api/ideas/" + ideaId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sandboxResult: { type: mode, prompt, resultText: result },
          }),
        }).catch(() => {});
      }

      toast.success(t.arena.generationComplete);
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
      <div className="flex gap-2">
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

      {/* Prompt input */}
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t.arena.promptPlaceholder}
          className="input-field flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
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
      {result && (
        <div className="bg-gray-800/80 rounded-xl p-4 border border-white/5">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
