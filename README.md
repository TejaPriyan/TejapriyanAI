# Teja Priyan AI

A polished, production-ready AI chat app — streaming replies, Markdown + syntax-highlighted code, image understanding, chat history, light/dark themes, and a **multi-provider fallback router** so the app keeps answering even when a provider rate-limits or retires a model.

Built with **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Prisma + SQLite**.

---

## Quick start

```bash
npm install
cp .env.example .env
npm run dev               # http://localhost:3000
```

`npm run dev` runs `prisma generate` + `prisma db push` first, so the SQLite database
(`prisma/dev.db`) is created automatically on first run.

### Getting a model — the free, no-API-key way (recommended)

Install [**Ollama**](https://ollama.com/download), then pull a model or two:

```bash
ollama pull qwen3:8b      # excellent all-round chat  (~5 GB)
ollama pull gemma3:4b     # small, and handles images (~3.3 GB)
```

That's it — **no API key, no account, no quota, works offline.** Ollama serves on
`127.0.0.1:11434` automatically and the router detects it on the next message.
Local models are ranked *above* every cloud provider, so they're always tried first
and you never touch a rate limit.

Low on RAM? `gemma3:1b` or `llama3.2:3b` run on an 8 GB laptop.
Got a big GPU? `qwen3:30b` and `gemma3:27b` are already in the route table.

**Or** use a free cloud key instead (Groq / Google both take ~2 minutes, no card) —
see the table below. You can do both: local first, cloud as automatic backup.

---

## Environment variables

Only `DATABASE_URL` is required. Every provider key is optional — the router simply
skips any route whose key is missing and moves down its ranked list.

| Variable | Provider | Where to get a free key | Notes |
|---|---|---|---|
| `DATABASE_URL` | SQLite | — | Defaults to `file:./dev.db` |
| `AUTH_SECRET` | — | `openssl rand -hex 32` | Signs the httpOnly session cookies. **Required in production** — rotating it logs everyone out. |
| `APP_URL` | — | — | Optional. Public URL, sent as OpenRouter attribution headers. |
| `NVIDIA_API_KEY` | **NVIDIA NIM** | <https://build.nvidia.com/> | Rank 1–3: Nemotron 30B reasoning/vision, Qwen 2.5 Coder 32B, Llama 3.3 70B. |
| `BYTEZ_API_KEY` | **Bytez Open Agent** | <https://bytez.com/> | Rank 4–5: Qwen 2.5 Coder 32B, Llama 3.3 70B high-availability network. |
| *(none needed)* | **Ollama** | <https://ollama.com/download> | **Free forever, no key, no quota, offline.** Optionally set `OLLAMA_HOST` if not on `127.0.0.1:11434`. |
| `GROQ_API_KEY` | **Groq** | <https://console.groq.com/keys> | Free, no card. Extremely fast. |
| `GOOGLE_API_KEY` | **Google Gemini (AI Studio)** | <https://aistudio.google.com/apikey> | Free tier, no card. Multimodal vision backup. |
| `OPENROUTER_API_KEY` | **OpenRouter** | <https://openrouter.ai/keys> | One key, many `:free` models. |
| `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` | **Cloudflare Workers AI** | <https://dash.cloudflare.com/profile/api-tokens> (token needs *Workers AI → Read*) | Extra backup provider. |
| `HF_TOKEN` | **Hugging Face Inference Providers** | <https://huggingface.co/settings/tokens> | Last resort cloud backup. |
| `RATE_LIMIT_PER_MINUTE` | — | — | Optional, defaults to `15` requests/user/minute. |
| `MODEL_ROUTES_JSON` | — | — | Optional. A JSON array that fully replaces the built-in route table. |

> **Free-tier models and limits move fast.** Model IDs get retired without notice — this is
> exactly what the fallback router exists for. To refresh the list:
>
> ```bash
> # Groq — what your key can actually call
> curl -s https://api.groq.com/openai/v1/models \
>   -H "Authorization: Bearer $GROQ_API_KEY" | jq -r '.data[].id'
>
> # OpenRouter — every currently-free model
> curl -s https://openrouter.ai/api/v1/models \
>   | jq -r '.data[] | select(.id|endswith(":free")) | .id'
> ```
>
> Then edit `DEFAULT_ROUTES` in `lib/modelRouter.ts` — one place, nothing else changes.

**Known free-tier quirks (observed live):**

* **Groq** enforces ~1000 *output* tokens/minute on the free tier. A Max-effort request can
  exceed that and return 429; the router transparently falls through to the next route.
* **OpenRouter `:free`** models are shared-capacity and frequently return
  `429 temporarily rate-limited upstream`. Several are listed so one is usually available.

---

## Architecture

```
app/
  page.tsx                 → marketing site (<Landing />)
  chat/page.tsx            → full-screen chat workspace (<ChatApp />)
  layout.tsx               → theme bootstrap (no flash of wrong theme)
  api/user/route.ts        → name-only onboarding, issues a user id
  api/chats/route.ts       → list / create chats (+ search across titles & messages)
  api/chats/[id]/route.ts  → load thread, rename, delete
  api/chat/route.ts        → THE chat endpoint; persists turns, streams SSE back
lib/
  modelRouter.ts           → ⭐ the only module that talks to an AI provider
  session.ts               → signed httpOnly session cookies (identity)
  db.ts                    → Prisma singleton
  rateLimit.ts             → per-user sliding window
  exportChat.ts            → download a thread as .txt
components/
  landing/Landing.tsx      → marketing page sections
  landing/Primitives.tsx   → scroll-reveal, counters, magnetic button
  landing/Charts.tsx       → hand-rolled animated SVG charts
  ChatApp.tsx              → state, SSE loop, layout
  Sidebar.tsx  Composer.tsx  MessageBubble.tsx  Markdown.tsx  NameModal.tsx
```

### The model router (`lib/modelRouter.ts`)

This is the heart of the app and the **only** code with provider knowledge.

* **Local-first.** Ollama routes occupy ranks 1–9, above every cloud provider, so free
  unlimited local inference is always preferred. The router probes `/api/tags` (cached 30 s)
  and **skips any model you haven't actually pulled** — so an out-of-the-box route table
  never causes a failed request. If Ollama isn't running at all, the probe fails fast
  (1.5 s timeout) and everything falls through to the cloud list.
* **Config-driven ranked list.** A plain `ModelRoute[]` array of
  `{ rank, provider, model, keyEnv, effort[], vision }`. Reorder, add or remove entries
  without touching another file — or override the whole table at runtime with
  `MODEL_ROUTES_JSON`.
* **Invisible failover.** Routes are filtered (key present · effort level · vision needed)
  then tried in rank order. Any timeout, 4xx/5xx, rate limit, retired model or empty
  stream silently advances to the next entry. The router even pulls the *first token*
  before committing, so a stream that dies on frame one still fails over cleanly.
* **One public function.** `streamChatCompletion(messages, effort, signal) → AsyncIterable<string>`.
  Nothing else in the app knows which provider answered.
* **Vision routing.** A turn carrying an image sets `needsVision`, which filters the
  list down to image-capable routes — local `gemma3` / `qwen2.5vl` / `llava` first, then
  Gemini, then OpenRouter's vision models (`nemotron-3-nano-omni` is the primary cloud
  vision route). Only the *latest* image is sent to the model — older images stay in
  the database for the UI but are not re-uploaded (and re-billed) on every turn.
* **Circuit breaker.** A route that hard-fails with 401/403/404 (model retired,
  key rejected, access restricted) is skipped for 10 minutes, so a dead model costs
  zero requests instead of a failed round-trip per message. 429s and timeouts never
  blacklist a route — they're transient.
* **Never a dead end.** If the requested tier has no available route (e.g. you asked for
  Max but only pulled small models), the router falls back to whatever *is* available
  rather than failing — the effort profile still applies.
* **Reasoning blocks stripped.** Models like `gpt-oss`, `qwen3.x` and `nemotron` emit an
  internal chain of thought wrapped in `<think>…</think>`. `stripReasoning()` filters this
  out mid-stream — including tags split across token boundaries — so only the real answer
  ever reaches the chat bubble.
* **All six providers normalised.** Groq / OpenRouter / Hugging Face share one
  OpenAI-compatible SSE implementation; Google (`streamGenerateContent`), Cloudflare
  Workers AI, and Ollama (native NDJSON `/api/chat`, with base64 images passed straight
  through) have their own adapters. Every one yields plain text deltas.
* **Total-failure path.** When every route fails, `AllProvidersFailedError` surfaces as a
  calm, on-brand message in the chat bubble — never a stack trace.

### Response depth: Fast / Think / Max / Ultra

The user sees **only** the label. Behind it, each level changes:

| Level | System guidance | Target tokens | Temperature | Timeout | Model tier |
|---|---|---|---|---|---|
| Fast | Concise and direct, zero preamble | 1024 | 0.5 | 30 s | High-speed response routes |
| Think | Reason carefully, structured detail | 3200 | 0.7 | 60 s | Balanced reasoning routes |
| Max | Deep, edge cases, comprehensive architecture | 8192 | 0.8 | 120 s | High-capacity reasoning models |
| Ultra | Maximum cognitive depth, exhaustive reasoning & proofs | Dynamic max | 0.9 | 180 s | Top-tier reasoning engines (Nemotron/Qwen/Llama) |

**No model, provider or company name appears anywhere in the UI**, and the persona is
instructed never to disclose them.

---

## Features

**Identity** — first visit asks only for a name. The server issues a signed,
httpOnly session cookie (30 days); the browser never gets to *claim* an identity,
so one user can never read, rename or delete another user's chats. The name is
cached in `localStorage` purely for display; if the cookie expires, re-entering
the name silently re-attaches the same account and all history.

**Chat** — streaming token-by-token SSE, stop-generating, regenerate, right/left aligned
bubbles, full Markdown (headings, lists, GFM tables, syntax-highlighted code with per-block
copy buttons), auto-expanding composer (Enter sends, Shift+Enter newline).

**Sidebar** — new chat, AI-generated titles from the first message, hover rename/delete,
full-text search across titles *and* message bodies, loading skeletons, mobile drawer.

**Images** — upload button, drag-and-drop, and clipboard paste; thumbnails render inline in
the thread; requests are routed to a vision-capable model automatically.

**Polish** — Framer Motion throughout (message fade/slide, spring sidebar, layout-animated
effort pill, press states), light/dark toggle with no flash, fully responsive.

**Interactive Code & Game Sandbox** — fenced HTML, JavaScript, Canvas, Game, and SVG blocks feature an instant interactive sandbox runner tab, restart button, fullscreen modal with Desktop & Mobile preview toggles, and a one-click direct file downloader.

**Extras** — export a chat to `.txt`, regenerate response, chat search, voice dictation via
the Web Speech API (Chrome/Edge/Safari).

---

### Adding more local models

Pull anything from the [Ollama library](https://ollama.com/library), then add a line to
`DEFAULT_ROUTES` in `lib/modelRouter.ts`:

```ts
{ rank: 5, provider: "ollama", model: "mistral:7b", keyEnv: "NONE",
  effort: ["fast", "think"], vision: false },
```

`keyEnv: "NONE"` marks the route as keyless. Set `vision: true` only for multimodal
models (`gemma3`, `gemma4`, `qwen3-vl`, `qwen2.5vl`, `llava`, `llama3.2-vision`).
Lower `rank` = tried earlier.

---

## Security & limits

* Keys live in environment variables only, read server-side in `lib/modelRouter.ts`.
  They are never bundled, never returned by an API route, never visible to the browser.
* The browser only ever calls `/api/chat`, `/api/chats`, `/api/user`.
* **Identity is a signed httpOnly cookie** (`lib/session.ts`) — every route derives the
  user server-side and ignores any client-supplied id, so cross-user access (IDOR) is
  not possible. Rate limiting keys off the same verified identity.
* Per-user sliding-window rate limiting (default 15 req/min) protects the shared free quota.
  Swap the in-memory `Map` in `lib/rateLimit.ts` for Redis if you run multiple instances.
* Uploaded images are capped at 4 MB client-side and validated server-side (data-URL
  format + size ceiling); text messages are capped at 32,000 characters.

## Production

```bash
npm run build && npm start
```

Before going live:

1. **Set `AUTH_SECRET`** (and rotate the API keys if they were ever committed or shared).
2. For Vercel or any serverless host, point `DATABASE_URL` at a hosted database
   (Postgres/Turso) and change the `datasource` provider in `prisma/schema.prisma` —
   SQLite files don't persist on ephemeral filesystems. Swap the in-memory rate
   limiter for Redis/Upstash at the same time (multi-instance).
3. `/api/chat` declares `maxDuration = 300`; check your host's function timeout
   covers Max/Ultra streams (Vercel Hobby caps at 60 s — Pro or self-hosting
   recommended for deep-effort usage).
4. `POST /api/user` still honors a one-time legacy-id claim so pre-auth accounts
   keep their history; delete that block once every visitor has signed in once.
