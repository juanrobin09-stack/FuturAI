import { getUserAiConfig } from "@/lib/ai-client";

export interface ExecutionResult {
  success: boolean;
  result?: string;
  resultUrl?: string;
  error?: string;
  provider?: string;
  durationMs?: number;
}

interface CallResult {
  text: string;
  url?: string;
}

interface ProviderStatus {
  name: string;
  connected: boolean;
  status: "ok" | "error" | "not_connected";
  lastChecked: string;
}

const TIMEOUT_MS = 30_000;
const LONG_TIMEOUT_MS = 90_000; // For Replicate/Leonardo/Kling (polling)
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
): Promise<CallResult> {
  const baseUrl = endpoint || "https://api.openai.com/v1";

  if (mode === "text-to-image") {
    const res = await fetchWithTimeout(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `OpenAI error ${res.status}`);
    const imageUrl = data.data?.[0]?.url;
    return {
      text: `[Image Generated]\nModel: DALL-E 3\nPrompt: "${prompt}"`,
      url: imageUrl || undefined,
    };
  }

  // text-to-code / text-to-video (use chat completions)
  const systemPrompt =
    mode === "text-to-code"
      ? "You are an expert AI code generator. Generate a COMPLETE, self-contained HTML page with embedded CSS and JavaScript that can be rendered directly in a browser iframe. The output must be a full HTML document starting with <!DOCTYPE html>. Use modern CSS (flexbox, grid, variables), vanilla JavaScript, and make it visually polished and interactive. Do NOT use markdown fences — output raw HTML only."
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
  return { text: data.choices?.[0]?.message?.content || "No response generated" };
}

async function callAnthropic(
  apiKey: string,
  prompt: string,
  mode: string
): Promise<CallResult> {
  const systemPrompt =
    mode === "text-to-code"
      ? "You are an expert AI code generator. Generate a COMPLETE, self-contained HTML page with embedded CSS and JavaScript that can be rendered directly in a browser iframe. The output must be a full HTML document starting with <!DOCTYPE html>. Use modern CSS (flexbox, grid, variables), vanilla JavaScript, and make it visually polished and interactive. Do NOT use markdown fences — output raw HTML only."
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
  return { text: textBlock?.text || "No response generated" };
}

async function callMistral(
  apiKey: string,
  prompt: string,
  mode: string
): Promise<CallResult> {
  const systemPrompt =
    mode === "text-to-code"
      ? "You are an expert AI code generator. Generate a COMPLETE, self-contained HTML page with embedded CSS and JavaScript that can be rendered directly in a browser iframe. The output must be a full HTML document starting with <!DOCTYPE html>. Use modern CSS, vanilla JavaScript, and make it visually polished. Do NOT use markdown fences — output raw HTML only."
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
  return { text: data.choices?.[0]?.message?.content || "No response generated" };
}

async function callGoogle(
  apiKey: string,
  prompt: string,
  mode: string
): Promise<CallResult> {
  const systemPrompt =
    mode === "text-to-code"
      ? "You are an expert AI code generator. Generate a COMPLETE, self-contained HTML page with embedded CSS and JavaScript that can be rendered directly in a browser iframe. The output must be a full HTML document starting with <!DOCTYPE html>. Use modern CSS, vanilla JavaScript, and make it visually polished. Do NOT use markdown fences — output raw HTML only."
      : "You are an AI assistant. Respond helpfully to the user request.";

  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Google error ${res.status}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";
  return { text };
}

async function callStability(
  apiKey: string,
  prompt: string,
  mode: string
): Promise<CallResult> {
  if (mode !== "text-to-image") {
    return { text: "Stability AI only supports image generation. Use a different provider for this mode." };
  }

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("output_format", "png");

  const res = await fetchWithTimeout(
    "https://api.stability.ai/v2beta/stable-image/generate/sd3",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: formData,
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.errors?.join(", ") || `Stability error ${res.status}`);
  const base64Url = `data:image/png;base64,${data.image}`;
  return {
    text: `[Image Generated]\nModel: Stable Diffusion 3.5\nPrompt: "${prompt}"`,
    url: base64Url,
  };
}

async function callLeonardo(
  apiKey: string,
  prompt: string,
  mode: string
): Promise<CallResult> {
  if (mode !== "text-to-image") {
    return { text: "Leonardo AI only supports image generation. Use a different provider for this mode." };
  }

  // Step 1: Create generation
  const createRes = await fetchWithTimeout(
    "https://cloud.leonardo.ai/api/rest/v1/generations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        modelId: "aa77f04e-3eec-4034-9c07-d0f619684628", // Leonardo Phoenix
        width: 1024,
        height: 1024,
        num_images: 1,
      }),
    }
  );
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(createData.error || `Leonardo error ${createRes.status}`);
  const generationId = createData.sdGenerationJob?.generationId;
  if (!generationId) throw new Error("No generation ID returned");

  // Step 2: Poll for result (max 60 seconds)
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(
      `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const pollData = await pollRes.json();
    const gen = pollData.generations_by_pk;
    if (gen?.status === "COMPLETE" && gen.generated_images?.length > 0) {
      const imageUrl = gen.generated_images[0].url;
      return {
        text: `[Image Generated]\nModel: Leonardo Phoenix\nPrompt: "${prompt}"`,
        url: imageUrl,
      };
    }
    if (gen?.status === "FAILED") throw new Error("Leonardo generation failed");
  }
  throw new Error("Leonardo generation timed out");
}

async function callReplicate(
  apiKey: string,
  prompt: string,
  mode: string
): Promise<CallResult> {
  if (mode === "text-to-code") {
    return { text: "Replicate is optimized for image and video generation. Use a different provider for code." };
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Prefer: "wait",
  };

  const model =
    mode === "text-to-image"
      ? "black-forest-labs/flux-1.1-pro"
      : "minimax/video-01-live";

  const res = await fetchWithTimeout(
    "https://api.replicate.com/v1/predictions",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        input: { prompt },
      }),
    },
    LONG_TIMEOUT_MS
  );

  let data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Replicate error ${res.status}`);

  // If Prefer: wait was honored, result is ready
  if (data.status !== "succeeded" && data.status !== "failed") {
    const pollUrl = data.urls?.get;
    if (!pollUrl) throw new Error("No polling URL returned");

    for (let i = 0; i < 45; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(pollUrl, { headers: { Authorization: `Bearer ${apiKey}` } });
      data = await pollRes.json();
      if (data.status === "succeeded") break;
      if (data.status === "failed" || data.status === "canceled") {
        throw new Error(data.error || "Prediction failed");
      }
    }
    if (data.status !== "succeeded") throw new Error("Prediction timed out");
  }

  const output = data.output;
  const outputUrl = Array.isArray(output) ? output[0] : output;

  return {
    text: `[${mode === "text-to-video" ? "Video" : "Image"} Generated]\nModel: ${model}\nPrompt: "${prompt}"`,
    url: outputUrl,
  };
}

async function callKling(
  apiKey: string,
  prompt: string,
  mode: string
): Promise<CallResult> {
  if (mode !== "text-to-video") {
    return { text: "Kling AI only supports video generation. Use a different provider for this mode." };
  }

  // Kling AI API — create video task
  const createRes = await fetchWithTimeout(
    "https://api.klingai.com/v1/videos/text2video",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        duration: "5",
        mode: "std",
      }),
    },
    LONG_TIMEOUT_MS
  );
  const createData = await createRes.json();
  if (createData.code !== 0 && !createData.data?.task_id) {
    throw new Error(createData.message || `Kling error ${createRes.status}`);
  }
  const taskId = createData.data?.task_id;
  if (!taskId) throw new Error("No task ID returned from Kling");

  // Poll for result (max 90 seconds)
  for (let i = 0; i < 45; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(
      `https://api.klingai.com/v1/videos/text2video/${taskId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const pollData = await pollRes.json();
    if (pollData.data?.task_status === "succeed" && pollData.data?.task_result?.videos?.length > 0) {
      const videoUrl = pollData.data.task_result.videos[0].url;
      return {
        text: `[Video Generated]\nModel: Kling AI\nPrompt: "${prompt}"`,
        url: videoUrl,
      };
    }
    if (pollData.data?.task_status === "failed") {
      throw new Error(pollData.data?.task_status_msg || "Kling generation failed");
    }
  }
  throw new Error("Kling generation timed out");
}

async function callCustom(
  apiKey: string,
  prompt: string,
  mode: string,
  endpoint: string
): Promise<CallResult> {
  return callOpenAI(apiKey, prompt, mode, endpoint);
}

// ─── Fetch with timeout ────────────────────────────────
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
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
      let callResult: CallResult;

      switch (provider) {
        case "openai":
          callResult = await callOpenAI(config.apiKey, prompt, mode, config.endpoint);
          break;
        case "anthropic":
          callResult = await callAnthropic(config.apiKey, prompt, mode);
          break;
        case "mistral":
          callResult = await callMistral(config.apiKey, prompt, mode);
          break;
        case "google":
          callResult = await callGoogle(config.apiKey, prompt, mode);
          break;
        case "stability":
          callResult = await callStability(config.apiKey, prompt, mode);
          break;
        case "leonardo":
          callResult = await callLeonardo(config.apiKey, prompt, mode);
          break;
        case "replicate":
          callResult = await callReplicate(config.apiKey, prompt, mode);
          break;
        case "kling":
          callResult = await callKling(config.apiKey, prompt, mode);
          break;
        case "custom":
          if (!config.endpoint) {
            return { success: false, error: "Custom provider requires an endpoint URL.", provider };
          }
          callResult = await callCustom(config.apiKey, prompt, mode, config.endpoint);
          break;
        default:
          return { success: false, error: `Unknown provider: ${provider}`, provider };
      }

      return {
        success: true,
        result: callResult.text,
        resultUrl: callResult.url,
        provider,
        durationMs: Date.now() - start,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      lastError = message;

      if (message.includes("abort") || message.includes("AbortError")) {
        return { success: false, error: "Request timed out.", provider, durationMs: Date.now() - start };
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
    let url: string;
    let headers: Record<string, string>;

    switch (provider) {
      case "openai":
        url = (config.endpoint || "https://api.openai.com/v1") + "/models";
        headers = { Authorization: `Bearer ${config.apiKey}` };
        break;
      case "anthropic": {
        const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "x-api-key": config.apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
        });
        return { name: provider, connected: true, status: res.ok || res.status === 400 ? "ok" : "error", lastChecked: now };
      }
      case "mistral":
        url = "https://api.mistral.ai/v1/models";
        headers = { Authorization: `Bearer ${config.apiKey}` };
        break;
      case "google":
        url = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`;
        headers = {};
        break;
      case "stability":
        url = "https://api.stability.ai/v1/user/account";
        headers = { Authorization: `Bearer ${config.apiKey}` };
        break;
      case "leonardo":
        url = "https://cloud.leonardo.ai/api/rest/v1/me";
        headers = { Authorization: `Bearer ${config.apiKey}` };
        break;
      case "replicate":
        url = "https://api.replicate.com/v1/account";
        headers = { Authorization: `Bearer ${config.apiKey}` };
        break;
      case "kling":
        url = "https://api.klingai.com/v1/account/balance";
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
      return { name: provider, connected: true, status: res.ok ? "ok" : "error", lastChecked: now };
    } catch {
      clearTimeout(timeoutId);
      return { name: provider, connected: true, status: "error", lastChecked: now };
    }
  } catch {
    return { name: provider, connected: true, status: "error", lastChecked: now };
  }
}
