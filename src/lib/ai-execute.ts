import { getUserAiConfig } from "@/lib/ai-client";

export interface ExecutionResult {
  success: boolean;
  result?: string;
  error?: string;
  provider?: string;
  durationMs?: number;
}

interface ProviderStatus {
  name: string;
  connected: boolean;
  status: "ok" | "error" | "not_connected";
  lastChecked: string;
}

const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 1;

// ─── In-memory rate limiter (per-process) ──────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// ─── Provider execution ────────────────────────────────
async function callOpenAI(
  apiKey: string,
  prompt: string,
  mode: string,
  endpoint?: string | null
): Promise<string> {
  const baseUrl = endpoint || "https://api.openai.com/v1";

  if (mode === "text-to-image") {
    const res = await fetchWithTimeout(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `OpenAI error ${res.status}`);
    return `[Image Generated]\nURL: ${data.data?.[0]?.url || "N/A"}\nPrompt: "${prompt}"\nModel: DALL-E 3`;
  }

  // text-to-code / text-to-video (use chat completions)
  const systemPrompt =
    mode === "text-to-code"
      ? "You are an expert AI code generator. Generate clean, production-ready code based on the user prompt. Include comments and type annotations."
      : "You are an AI video generation assistant. Describe in detail how the requested video would be generated, including storyboard, technical parameters, and implementation steps.";

  const res = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `OpenAI error ${res.status}`);
  return data.choices?.[0]?.message?.content || "No response generated";
}

async function callAnthropic(
  apiKey: string,
  prompt: string,
  mode: string
): Promise<string> {
  const systemPrompt =
    mode === "text-to-code"
      ? "You are an expert AI code generator. Generate clean, production-ready code based on the user prompt. Include comments and type annotations."
      : mode === "text-to-image"
      ? "You are an AI image generation assistant. Describe in detail how the requested image would be generated, including composition, style, technical parameters."
      : "You are an AI video generation assistant. Describe in detail how the requested video would be generated.";

  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Anthropic error ${res.status}`);
  const textBlock = data.content?.find((b: { type: string }) => b.type === "text");
  return textBlock?.text || "No response generated";
}

async function callMistral(
  apiKey: string,
  prompt: string,
  mode: string
): Promise<string> {
  const systemPrompt =
    mode === "text-to-code"
      ? "You are an expert AI code generator. Generate clean, production-ready code."
      : "You are an AI assistant. Respond helpfully to the user request.";

  const res = await fetchWithTimeout("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Mistral error ${res.status}`);
  return data.choices?.[0]?.message?.content || "No response generated";
}

async function callCustom(
  apiKey: string,
  prompt: string,
  mode: string,
  endpoint: string
): Promise<string> {
  // Custom endpoints follow OpenAI-compatible format
  return callOpenAI(apiKey, prompt, mode, endpoint);
}

// ─── Fetch with timeout ────────────────────────────────
async function fetchWithTimeout(
  url: string,
  options: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Main execution function ───────────────────────────
export async function executeAI(
  userId: string,
  provider: string,
  prompt: string,
  mode: string
): Promise<ExecutionResult> {
  const start = Date.now();

  // Rate limit check
  if (!checkRateLimit(userId)) {
    return {
      success: false,
      error: "Rate limit exceeded. Maximum 20 requests per minute.",
      provider,
    };
  }

  // Get user's API key
  const config = await getUserAiConfig(userId, provider);
  if (!config) {
    return {
      success: false,
      error: "no_api_key",
      provider,
    };
  }

  // Execute with retry
  let lastError = "";
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      let result: string;

      switch (provider) {
        case "openai":
          result = await callOpenAI(config.apiKey, prompt, mode, config.endpoint);
          break;
        case "anthropic":
          result = await callAnthropic(config.apiKey, prompt, mode);
          break;
        case "mistral":
          result = await callMistral(config.apiKey, prompt, mode);
          break;
        case "custom":
          if (!config.endpoint) {
            return { success: false, error: "Custom provider requires an endpoint URL.", provider };
          }
          result = await callCustom(config.apiKey, prompt, mode, config.endpoint);
          break;
        default:
          return { success: false, error: `Unknown provider: ${provider}`, provider };
      }

      return {
        success: true,
        result,
        provider,
        durationMs: Date.now() - start,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      lastError = message;

      // Don't retry on client errors (4xx except 429)
      if (message.includes("abort") || message.includes("AbortError")) {
        return { success: false, error: "Request timed out after 30 seconds.", provider, durationMs: Date.now() - start };
      }

      if (attempt < MAX_RETRIES && (message.includes("429") || message.includes("5"))) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  return {
    success: false,
    error: lastError || "Execution failed after retries.",
    provider,
    durationMs: Date.now() - start,
  };
}

// ─── Provider health check ─────────────────────────────
export async function checkProviderStatus(
  userId: string,
  provider: string
): Promise<ProviderStatus> {
  const config = await getUserAiConfig(userId, provider);
  const now = new Date().toISOString();

  if (!config) {
    return { name: provider, connected: false, status: "not_connected", lastChecked: now };
  }

  try {
    // Lightweight validation — just check auth works
    let url: string;
    let headers: Record<string, string>;

    switch (provider) {
      case "openai":
        url = (config.endpoint || "https://api.openai.com/v1") + "/models";
        headers = { Authorization: `Bearer ${config.apiKey}` };
        break;
      case "anthropic":
        // Anthropic doesn't have a /models endpoint; use messages with tiny payload
        url = "https://api.anthropic.com/v1/messages";
        headers = { "x-api-key": config.apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" };
        // We'll just check if auth header is accepted (send minimal request)
        const res = await fetchWithTimeout(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
        });
        return {
          name: provider,
          connected: true,
          status: res.ok || res.status === 400 ? "ok" : "error",
          lastChecked: now,
        };
      case "mistral":
        url = "https://api.mistral.ai/v1/models";
        headers = { Authorization: `Bearer ${config.apiKey}` };
        break;
      case "custom":
        url = (config.endpoint || "") + "/models";
        headers = { Authorization: `Bearer ${config.apiKey}` };
        break;
      default:
        return { name: provider, connected: false, status: "not_connected", lastChecked: now };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      return {
        name: provider,
        connected: true,
        status: res.ok ? "ok" : "error",
        lastChecked: now,
      };
    } catch {
      clearTimeout(timeoutId);
      return { name: provider, connected: true, status: "error", lastChecked: now };
    }
  } catch {
    return { name: provider, connected: true, status: "error", lastChecked: now };
  }
}
