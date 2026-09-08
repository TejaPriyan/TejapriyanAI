/**
 * modelRouter.ts — the ONLY module in the app that talks to an external AI provider.
 *
 * Everything else (API routes, UI) calls `streamChatCompletion()` and never learns
 * which provider or model actually answered. The ranked list below is plain config:
 * edit it (or MODEL_ROUTES_JSON in env) without touching any other file.
 */

export type EffortLevel = "fast" | "think" | "max" | "ultra";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  /** Optional data URL (data:image/png;base64,....) for vision requests */
  image?: string | null;
};

export type ProviderName =
  | "ollama"
  | "groq"
  | "google"
  | "openrouter"
  | "cloudflare"
  | "huggingface";

export type ModelRoute = {
  /** Backend provider implementation to use */
  provider: ProviderName;
  /** Provider-specific model identifier */
  model: string;
  /**
   * Name of the environment variable holding the API key.
   * Use the sentinel "NONE" for keyless providers (e.g. local Ollama) — those
   * routes are always considered available and are never filtered out.
   */
  keyEnv: string;
  /** Which effort levels this route is allowed to serve */
  effort: EffortLevel[];
  /** True if the model accepts image input */
  vision: boolean;
  /** Lower number = tried first */
  rank: number;
};

/* -------------------------------------------------------------------------- */
/* Ranked, config-driven route table                                          */
/* -------------------------------------------------------------------------- */

const DEFAULT_ROUTES: ModelRoute[] = [
  // --- Ollama: 100% free, NO API KEY, runs locally, no quota ever. ---------
  // Tried first whenever the local server is reachable. Any model listed here
  // that you haven't pulled is skipped automatically (we check `/api/tags`).
  { rank: 1, provider: "ollama", model: "qwen3:8b", keyEnv: "NONE", effort: ["fast", "think"], vision: false },
  { rank: 2, provider: "ollama", model: "gemma3:4b", keyEnv: "NONE", effort: ["fast"], vision: true },
  { rank: 3, provider: "ollama", model: "gemma3:12b", keyEnv: "NONE", effort: ["fast", "think"], vision: true },
  { rank: 4, provider: "ollama", model: "qwen3:14b", keyEnv: "NONE", effort: ["think", "max"], vision: false },
  { rank: 5, provider: "ollama", model: "qwen2.5vl:7b", keyEnv: "NONE", effort: ["fast", "think", "max"], vision: true },
  { rank: 6, provider: "ollama", model: "llava:7b", keyEnv: "NONE", effort: ["fast", "think"], vision: true },
  { rank: 7, provider: "ollama", model: "gemma3:27b", keyEnv: "NONE", effort: ["max"], vision: true },
  { rank: 8, provider: "ollama", model: "qwen3:30b", keyEnv: "NONE", effort: ["max"], vision: false },
  { rank: 9, provider: "ollama", model: "llama3.1:8b", keyEnv: "NONE", effort: ["fast", "think"], vision: false },

  // --- Groq: free, no card, extremely fast. Default for "fast". ------------
  // Keep working routes first: a retired model adds a failed network request
  // before the user sees the first streamed token.
  { rank: 10, provider: "groq", model: "openai/gpt-oss-20b", keyEnv: "GROQ_API_KEY", effort: ["fast", "think"], vision: false },
  { rank: 11, provider: "groq", model: "openai/gpt-oss-120b", keyEnv: "GROQ_API_KEY", effort: ["think", "max"], vision: false },
  { rank: 17, provider: "groq", model: "qwen/qwen3.6-27b", keyEnv: "GROQ_API_KEY", effort: ["fast", "think"], vision: false },
  { rank: 18, provider: "groq", model: "qwen/qwen3.8-27b", keyEnv: "GROQ_API_KEY", effort: ["think", "max"], vision: false },
  { rank: 19, provider: "groq", model: "groq/compound-mini", keyEnv: "GROQ_API_KEY", effort: ["fast", "think"], vision: false },

  // --- Google Gemini (AI Studio free tier): native vision across the family -
  { rank: 20, provider: "google", model: "gemini-2.0-flash", keyEnv: "GOOGLE_API_KEY", effort: ["fast", "think"], vision: true },
  { rank: 21, provider: "google", model: "gemini-2.5-flash", keyEnv: "GOOGLE_API_KEY", effort: ["think", "max"], vision: true },
  { rank: 22, provider: "google", model: "gemini-2.5-pro", keyEnv: "GOOGLE_API_KEY", effort: ["max"], vision: true },

  // --- OpenRouter: one key, many :free models -------------------------------
  // ":free" models are shared-capacity and sometimes return 429 "temporarily
  // rate-limited upstream" — the router just falls through to the next one.
  // Every ID below was verified live (models catalogue + a smoke completion)
  // in September 2026. Retired/restricted models (minimax-m3:free 404,
  // thinkingmachines/inkling:free 403 "agentic harnesses only") were removed.
  // A route that hard-fails anyway is put in a 10-minute cooldown by the
  // circuit breaker in streamChatCompletion, so it costs zero requests.
  // nemotron-3-nano-omni is the primary cloud vision route (accepts image_url
  // parts; also audio/video-capable upstream).
  { rank: 30, provider: "openrouter", model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", keyEnv: "OPENROUTER_API_KEY", effort: ["fast", "think"], vision: true },
  { rank: 31, provider: "openrouter", model: "google/gemma-4-31b-it:free", keyEnv: "OPENROUTER_API_KEY", effort: ["fast", "think"], vision: true },
  { rank: 32, provider: "openrouter", model: "google/gemma-4-26b-a4b-it:free", keyEnv: "OPENROUTER_API_KEY", effort: ["fast", "think"], vision: true },
  { rank: 33, provider: "openrouter", model: "nvidia/nemotron-3-super-120b-a12b:free", keyEnv: "OPENROUTER_API_KEY", effort: ["think", "max"], vision: false },
  { rank: 34, provider: "openrouter", model: "nvidia/nemotron-3-ultra-550b-a55b:free", keyEnv: "OPENROUTER_API_KEY", effort: ["max"], vision: false },
  { rank: 35, provider: "openrouter", model: "nvidia/nemotron-3.5-lightning:free", keyEnv: "OPENROUTER_API_KEY", effort: ["fast", "think"], vision: false },
  { rank: 36, provider: "openrouter", model: "liquid/lfm-2.5-2.6b:free", keyEnv: "OPENROUTER_API_KEY", effort: ["fast"], vision: false },
  { rank: 37, provider: "openrouter", model: "cohere/north-mini-code:free", keyEnv: "OPENROUTER_API_KEY", effort: ["fast", "think"], vision: false },
  { rank: 38, provider: "openrouter", model: "poolside/laguna-s-2.1:free", keyEnv: "OPENROUTER_API_KEY", effort: ["think", "max"], vision: false },
  { rank: 39, provider: "openrouter", model: "dots-studio/dots-3-note-preview:free", keyEnv: "OPENROUTER_API_KEY", effort: ["fast", "think"], vision: true },

  // --- Cloudflare Workers AI: separate free daily allowance -----------------
  { rank: 40, provider: "cloudflare", model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", keyEnv: "CLOUDFLARE_API_TOKEN", effort: ["fast", "think", "max"], vision: false },

  // --- Hugging Face Inference Providers: thin free allowance, last resort ---
  { rank: 50, provider: "huggingface", model: "meta-llama/Llama-3.1-8B-Instruct", keyEnv: "HF_TOKEN", effort: ["fast", "think", "max"], vision: false },
];

/* -------------------------------------------------------------------------- */
/* Ollama local-model detection                                               */
/* -------------------------------------------------------------------------- */

/** Where the local Ollama server lives. Override with OLLAMA_HOST if needed. */
const OLLAMA_HOST = (process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/$/, "");

/** Cached set of model tags actually pulled locally (refreshed periodically). */
let ollamaCache: { models: Set<string>; at: number } = { models: new Set(), at: 0 };
const OLLAMA_TTL_MS = 30_000;

/**
 * Ask the local Ollama server which models are installed.
 * Returns an empty set if Ollama isn't running — those routes then get skipped
 * and the router falls through to the cloud providers automatically.
 */
export async function getOllamaModels(force = false): Promise<Set<string>> {
  const now = Date.now();
  if (!force && now - ollamaCache.at < OLLAMA_TTL_MS) return ollamaCache.models;
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const models = new Set<string>();
    for (const m of data.models ?? []) {
      models.add(m.name);                       // e.g. "qwen3:8b"
      models.add(String(m.name).split(":")[0]); // e.g. "qwen3"
    }
    ollamaCache = { models, at: now };
    return models;
  } catch {
    ollamaCache = { models: new Set(), at: now };
    return ollamaCache.models;
  }
}

/**
 * True if this route's model is pulled locally.
 * Matching is exact on the full tag ("qwen3:8b"), so having gemma3:4b installed
 * does NOT make us try gemma3:27b. A route written without a size ("qwen3")
 * matches any installed size of that family.
 */
function ollamaHas(models: Set<string>, tag: string): boolean {
  if (models.has(tag)) return true;
  // Size-less route tag: accept the family's ":latest" install.
  if (!tag.includes(":")) return models.has(`${tag}:latest`);
  return false;
}

/** Allow full override of the table via env, e.g. MODEL_ROUTES_JSON='[...]' */
function loadRoutes(): ModelRoute[] {
  const raw = process.env.MODEL_ROUTES_JSON;
  if (raw) {
    try {
      return (JSON.parse(raw) as ModelRoute[]).sort((a, b) => a.rank - b.rank);
    } catch {
      console.warn("[modelRouter] MODEL_ROUTES_JSON invalid, using defaults");
    }
  }
  return [...DEFAULT_ROUTES].sort((a, b) => a.rank - b.rank);
}

/* -------------------------------------------------------------------------- */
/* Effort profiles — the only thing the visible Fast/Think/Max label changes   */
/* -------------------------------------------------------------------------- */

const EFFORT_PROFILES: Record<
  EffortLevel,
  { maxTokens: number; temperature: number; guidance: string; timeoutMs: number }
> = {
  fast: {
    maxTokens: 1024,
    temperature: 0.5,
    timeoutMs: 30_000,
    guidance:
      "Answer concisely and directly. Prefer short paragraphs and tight bullet lists. Skip preamble.",
  },
  think: {
    maxTokens: 2600,
    temperature: 0.7,
    timeoutMs: 60_000,
    guidance:
      "Reason carefully before answering. Give a well-structured answer with helpful detail, examples and headings where useful.",
  },
  max: {
    maxTokens: 6000,
    temperature: 0.8,
    timeoutMs: 120_000,
    guidance:
      "Think deeply and thoroughly. Explore edge cases, trade-offs and alternatives. Produce a comprehensive, well-organised answer without filler.",
  },
  ultra: {
    maxTokens: 12000,
    temperature: 0.9,
    timeoutMs: 180_000,
    guidance:
      "Think at maximum depth. Show all working, explore every edge case, and consider alternatives and trade-offs. Produce the most comprehensive, well-structured response possible without padding.",
  },
};

const PERSONA = `You are Teja Priyan AI, a helpful, clear and professional AI assistant.
If asked who you are, say you are Teja Priyan AI. Never mention or speculate about the
underlying model, provider, company or infrastructure that powers you.
Use natural, conversational prose by default: answer the question directly, then add only
the detail that helps. Do not force a heading, summary, "key points", bullets, numbered
steps, or a table into every answer. Use a short list only when the user asks for one or
there are several distinct items; use numbered steps only for a process; use a table only
when the user requests one or when comparing multiple options is genuinely clearer in a
table. For maths, show clean equations and only the working needed to understand the result.
Use Markdown and fenced code blocks with language tags when they genuinely improve clarity.`;

function systemPrompt(effort: EffortLevel) {
  return `${PERSONA}\n\n${EFFORT_PROFILES[effort].guidance}`;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function parseDataUrl(dataUrl: string): { mime: string; base64: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  return m ? { mime: m[1], base64: m[2] } : null;
}

/** OpenAI-compatible message shape (Groq / OpenRouter / HF router all speak it) */
function toOpenAIMessages(messages: ChatMessage[], effort: EffortLevel) {
  const out: any[] = [{ role: "system", content: systemPrompt(effort) }];
  for (const m of messages) {
    if (m.role === "system") continue;
    if (m.image) {
      out.push({
        role: m.role,
        content: [
          { type: "text", text: m.content || "Describe this image." },
          { type: "image_url", image_url: { url: m.image } },
        ],
      });
    } else {
      out.push({ role: m.role, content: m.content });
    }
  }
  return out;
}

/** Turns an SSE byte stream of OpenAI `chat.completion.chunk`s into text deltas */
async function* openAISSEToText(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta =
          json.choices?.[0]?.delta?.content ??
          json.choices?.[0]?.message?.content ??
          "";
        if (delta) yield delta as string;
      } catch {
        /* ignore keep-alives / partial frames */
      }
    }
  }
}

class ProviderError extends Error {}

/**
 * Strips reasoning/thinking blocks from a token stream.
 *
 * Reasoning models (qwen3.x, gpt-oss, deepseek-r1, nemotron …) emit their chain
 * of thought wrapped in <think>…</think> before the real answer. That's internal
 * scratch work — it must never reach the chat bubble. We suppress everything
 * inside the tags while still streaming the visible answer token-by-token.
 */
async function* stripReasoning(src: AsyncIterable<string>): AsyncIterable<string> {
  const OPEN = /<(think|thinking|reasoning)>/i;
  const CLOSE = /<\/(think|thinking|reasoning)>/i;
  // Longest tag we must be able to reassemble across chunk boundaries.
  const TAIL = 12;

  let buf = "";
  let inside = false;
  let sawVisible = false;

  for await (const chunk of src) {
    buf += chunk;

    while (buf) {
      if (inside) {
        const close = CLOSE.exec(buf);
        if (!close) {
          // Still inside a think block: drop it, but keep a short tail in case
          // a closing tag is split across chunk boundaries.
          if (buf.length > TAIL) buf = buf.slice(buf.length - TAIL);
          break;
        }
        buf = buf.slice(close.index + close[0].length);
        inside = false;
        continue;
      }

      const open = OPEN.exec(buf);
      if (open) {
        const visible = buf.slice(0, open.index);
        if (visible) { sawVisible = true; yield visible; }
        buf = buf.slice(open.index + open[0].length);
        inside = true;
        continue;
      }

      // No tag in view. Hold back a small tail in case a tag straddles chunks.
      if (buf.length > TAIL) {
        const emit = buf.slice(0, buf.length - TAIL);
        // Don't emit leading whitespace before the first real content.
        const out = sawVisible ? emit : emit.replace(/^\s+/, "");
        if (out) { sawVisible = true; yield out; }
        buf = buf.slice(buf.length - TAIL);
      }
      break;
    }
  }

  // Flush whatever is left (unless we ended mid-think).
  if (!inside && buf) {
    const out = sawVisible ? buf : buf.replace(/^\s+/, "");
    if (out) yield out;
  }
}

/* -------------------------------------------------------------------------- */
/* Provider implementations — each returns an async iterable of text chunks    */
/* -------------------------------------------------------------------------- */

type StreamFn = (
  route: ModelRoute,
  messages: ChatMessage[],
  effort: EffortLevel,
  signal: AbortSignal
) => Promise<AsyncIterable<string>>;

/** Per-provider request-body tweak applied before sending. */
type BodyTweak = (
  body: Record<string, unknown>,
  route: ModelRoute,
  effort: EffortLevel
) => Record<string, unknown>;

/** Shared implementation for every OpenAI-compatible endpoint. */
function openAICompatible(
  baseUrl: string,
  extraHeaders: Record<string, string> = {},
  tweakBody?: BodyTweak
): StreamFn {
  return async (route, messages, effort, signal) => {
    const p = EFFORT_PROFILES[effort];
    const base: Record<string, unknown> = {
      model: route.model,
      messages: toOpenAIMessages(messages, effort),
      temperature: p.temperature,
      max_tokens: p.maxTokens,
      stream: true,
    };
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env[route.keyEnv]}`,
        ...extraHeaders,
      },
      body: JSON.stringify(tweakBody ? tweakBody(base, route, effort) : base),
    });
    if (!res.ok || !res.body) {
      throw new ProviderError(`${route.provider}/${route.model} → ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300));
    }
    return openAISSEToText(res.body);
  };
}

const streamGroq = openAICompatible(
  "https://api.groq.com/openai/v1",
  {},
  // Groq accepts `reasoning_effort` ONLY on gpt-oss models (400 on the rest),
  // so gate it per route. Keeps Fast replies from spending the whole token
  // budget on hidden chain-of-thought.
  (body, route, effort) =>
    effort === "fast" && route.model.startsWith("openai/gpt-oss")
      ? { ...body, reasoning_effort: "low" }
      : body
);

const streamOpenRouter = openAICompatible(
  "https://openrouter.ai/api/v1",
  {
    "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
    "X-Title": "Teja Priyan AI",
  },
  // On Fast, reasoning models are told to think briefly — otherwise
  // nemotron-class models can burn the entire 1024-token budget on hidden
  // reasoning and return a truncated answer. Harmlessly ignored by
  // non-reasoning models.
  (body, _route, effort) =>
    effort === "fast" ? { ...body, reasoning: { effort: "low" } } : body
);

const streamHuggingFace = openAICompatible("https://router.huggingface.co/v1");

/** Google Gemini — native multimodal, streamGenerateContent with SSE. */
const streamGoogle: StreamFn = async (route, messages, effort, signal) => {
  const p = EFFORT_PROFILES[effort];
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const parts: any[] = [];
      if (m.image) {
        const img = parseDataUrl(m.image);
        if (img) parts.push({ inline_data: { mime_type: img.mime, data: img.base64 } });
      }
      parts.push({ text: m.content || "Describe this image." });
      return { role: m.role === "assistant" ? "model" : "user", parts };
    });

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${route.model}:streamGenerateContent?alt=sse&key=${process.env[route.keyEnv]}`;

  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemPrompt(effort) }] },
      generationConfig: { temperature: p.temperature, maxOutputTokens: p.maxTokens },
    }),
  });
  if (!res.ok || !res.body) {
    throw new ProviderError(`google/${route.model} → ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300));
  }

  const body = res.body;
  return (async function* () {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        try {
          const json = JSON.parse(t.slice(5).trim());
          for (const part of json.candidates?.[0]?.content?.parts ?? []) {
            if (part.text) yield part.text as string;
          }
        } catch {
          /* ignore */
        }
      }
    }
  })();
};

/** Cloudflare Workers AI — free daily allowance, SSE stream. */
const streamCloudflare: StreamFn = async (route, messages, effort, signal) => {
  const p = EFFORT_PROFILES[effort];
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!account) throw new ProviderError("CLOUDFLARE_ACCOUNT_ID missing");
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${route.model}`,
    {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env[route.keyEnv]}`,
      },
      body: JSON.stringify({
        messages: toOpenAIMessages(messages, effort),
        max_tokens: p.maxTokens,
        temperature: p.temperature,
        stream: true,
      }),
    }
  );
  if (!res.ok || !res.body) {
    throw new ProviderError(`cloudflare/${route.model} → ${res.status}`);
  }
  const body = res.body;
  return (async function* () {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload);
          const delta = json.response ?? json.choices?.[0]?.delta?.content ?? "";
          if (delta) yield delta as string;
        } catch {
          /* ignore */
        }
      }
    }
  })();
};

/**
 * Ollama — free, local, no API key, no quota.
 * Uses the native /api/chat endpoint (NDJSON stream) which accepts base64
 * images directly on each message, so vision models like gemma3 / qwen2.5vl
 * work without any extra plumbing.
 */
const streamOllama: StreamFn = async (route, messages, effort, signal) => {
  const p = EFFORT_PROFILES[effort];

  const ollamaMessages = [
    { role: "system", content: systemPrompt(effort) },
    ...messages
      .filter((m) => m.role !== "system")
      .map((m) => {
        const base: any = { role: m.role, content: m.content || "Describe this image." };
        if (m.image) {
          const img = parseDataUrl(m.image);
          // Ollama wants a bare base64 string (no data: prefix) in `images`.
          if (img) base.images = [img.base64];
        }
        return base;
      }),
  ];

  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: route.model,
      messages: ollamaMessages,
      stream: true,
      options: { temperature: p.temperature, num_predict: p.maxTokens },
    }),
  });

  if (!res.ok || !res.body) {
    throw new ProviderError(`ollama/${route.model} → ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300));
  }

  const body = res.body;
  return (async function* () {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      // Ollama streams newline-delimited JSON, not SSE.
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        try {
          const json = JSON.parse(t);
          if (json.error) throw new ProviderError(`ollama: ${json.error}`);
          const delta = json.message?.content ?? "";
          if (delta) yield delta as string;
          if (json.done) return;
        } catch (e) {
          if (e instanceof ProviderError) throw e;
          /* ignore partial frames */
        }
      }
    }
  })();
};

const PROVIDERS: Record<ProviderName, StreamFn> = {
  ollama: streamOllama,
  groq: streamGroq,
  google: streamGoogle,
  openrouter: streamOpenRouter,
  cloudflare: streamCloudflare,
  huggingface: streamHuggingFace,
};

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export class AllProvidersFailedError extends Error {
  constructor(public attempts: string[]) {
    super("All providers failed");
  }
}

/**
 * Circuit breaker: a route that hard-failed with 401/403/404 (model retired,
 * key rejected, access restricted) is skipped for this long. 429s, timeouts
 * and 5xx are transient by nature and never blacklist a route.
 */
const DEAD_ROUTE_COOLDOWN_MS = 10 * 60_000;
const deadUntil = new Map<string, number>();

/** A route is "keyless" (always available) when it needs no credential. */
function isKeyless(r: ModelRoute) {
  return r.keyEnv === "NONE" || r.provider === "ollama";
}

/**
 * Which routes are usable for this request, in rank order.
 *
 * Cloud routes need their key present; Ollama routes need the model to actually
 * be pulled locally. `installed` is the set from getOllamaModels() — pass an
 * empty set to disable local routes entirely.
 */
export function selectRoutes(
  effort: EffortLevel,
  needsVision: boolean,
  installed: Set<string> = new Set()
): ModelRoute[] {
  const available = loadRoutes().filter((r) => {
    const usable = isKeyless(r)
      ? r.provider === "ollama"
        ? ollamaHas(installed, r.model)
        : true
      : !!process.env[r.keyEnv];
    return usable && (needsVision ? r.vision : true);
  });

  const preferred = available.filter((r) => r.effort.includes(effort) || needsVision || effort === "ultra");

  // Never return an empty list just because the requested tier isn't available.
  // If you only pulled small local models, "Max" still answers on what you have
  // (the effort profile — token budget, temperature, prompt — still applies).
  if (preferred.length > 0) {
    // Append the remaining routes as extra fallbacks after the preferred ones.
    const rest = available.filter((r) => !preferred.includes(r));
    return [...preferred, ...rest];
  }
  return available;
}

/**
 * True if the app can answer at all: either a cloud key is set, or a local
 * Ollama model is available. Async because it probes the local server.
 */
export async function hasAnyProviderConfigured(): Promise<boolean> {
  const cloud = loadRoutes().some((r) => !isKeyless(r) && !!process.env[r.keyEnv]);
  if (cloud) return true;
  const installed = await getOllamaModels();
  return loadRoutes().some(
    (r) => r.provider === "ollama" && ollamaHas(installed, r.model)
  );
}

/**
 * Stream a chat completion, transparently failing over down the ranked list.
 *
 * Failover happens on connection errors, non-2xx responses, timeouts and
 * empty streams. Once the first token of a route has been emitted we are
 * committed to that route (we can't un-send tokens to the client).
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  effort: EffortLevel = "fast",
  clientSignal?: AbortSignal
): Promise<AsyncIterable<string>> {
  const needsVision = messages.some((m) => !!m.image);
  // Probe local Ollama first — free, unlimited routes get priority.
  const installed = await getOllamaModels();
  const routes = selectRoutes(effort, needsVision, installed);
  const attempts: string[] = [];

  /** Inter-chunk idle timeout — if no token arrives within this window the
   *  stream is considered stalled. 20 seconds is generous enough for slow
   *  reasoning models but short enough to fail over before the user gives up. */
  const IDLE_TIMEOUT_MS = 20_000;

  for (const route of routes) {
    // Skip routes still in their hard-failure cooldown — a retired model must
    // not cost a failed round-trip (and its full TTFT timeout) on every message.
    const routeKey = `${route.provider}/${route.model}`;
    if (Date.now() < (deadUntil.get(routeKey) ?? 0)) continue;

    const controller = new AbortController();

    // Phase 1: Time-To-First-Token timeout. Uses the full effort budget
    // (30 s Fast, 60 s Think, 120 s Max, 180 s Ultra) for the initial
    // connection + first chunk. Cleared once the first token arrives.
    let timer: ReturnType<typeof setTimeout> | null = setTimeout(
      () => controller.abort(),
      EFFORT_PROFILES[effort].timeoutMs
    );
    const onClientAbort = () => controller.abort();
    clientSignal?.addEventListener("abort", onClientAbort);

    /** Reset (or start) the idle-chunk timer. */
    const resetIdle = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => controller.abort(), IDLE_TIMEOUT_MS);
    };

    try {
      const iterable = await PROVIDERS[route.provider](
        route,
        messages,
        effort,
        controller.signal
      );

      // Pull the first chunk here so an immediately-failing stream still fails over.
      const iterator = iterable[Symbol.asyncIterator]();
      const first = await iterator.next();
      if (first.done) throw new ProviderError("empty stream");

      // Phase 2: First token received — switch to idle-chunk timeout.
      resetIdle();

      console.log(`[modelRouter] served by ${route.provider}/${route.model} (${effort})`);
      deadUntil.delete(routeKey); // healthy again — reset the breaker

      // Re-join the first chunk with the rest, then filter out reasoning blocks.
      const rejoined = (async function* () {
        try {
          yield first.value;
          while (true) {
            const n = await iterator.next();
            if (n.done) break;
            resetIdle(); // keep the idle timer alive on every chunk
            yield n.value;
          }
        } finally {
          if (timer) clearTimeout(timer);
          timer = null;
          clientSignal?.removeEventListener("abort", onClientAbort);
        }
      })();

      return stripReasoning(rejoined);
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      timer = null;
      clientSignal?.removeEventListener("abort", onClientAbort);
      if (clientSignal?.aborted) throw err; // user pressed Stop — don't fail over
      attempts.push(`${route.provider}/${route.model}: ${err?.message ?? err}`);
      console.warn(`[modelRouter] failover from ${route.provider}/${route.model}:`, err?.message);
      // Hard failure ("→ 401/403/404" in the ProviderError text) → long cooldown.
      // An empty stream (reasoning model that spent its whole token budget on
      // hidden chain-of-thought) → short cooldown, so a route that repeatedly
      // comes back empty stops being retried on every message but self-heals
      // quickly if it was a one-off.
      const msg = String(err?.message ?? "");
      if (/→ (401|403|404)\b/.test(msg)) {
        deadUntil.set(routeKey, Date.now() + DEAD_ROUTE_COOLDOWN_MS);
        console.warn(`[modelRouter] ${routeKey} hard-failed — skipping for 10 min`);
      } else if (/empty stream/.test(msg)) {
        deadUntil.set(routeKey, Date.now() + 60_000);
        console.warn(`[modelRouter] ${routeKey} returned an empty stream — skipping for 60 s`);
      }
    }
  }

  throw new AllProvidersFailedError(attempts);
}

/** Cheap non-streaming call used to auto-title chats. Falls back to a heuristic. */
export async function generateTitle(firstMessage: string): Promise<string> {
  const fallback =
    firstMessage.replace(/\s+/g, " ").trim().slice(0, 48) ||
    "New chat";
  try {
    const stream = await streamChatCompletion(
      [
        {
          role: "user",
          content: `Write a 3-5 word title for a conversation that starts with this message. Reply with the title only, no quotes:\n\n"${firstMessage.slice(0, 500)}"`,
        },
      ],
      "fast"
    );
    let out = "";
    for await (const c of stream) out += c;
    const cleaned = out.replace(/["\n]/g, " ").replace(/\s+/g, " ").trim();
    return cleaned ? cleaned.slice(0, 60) : fallback;
  } catch {
    return fallback;
  }
}
