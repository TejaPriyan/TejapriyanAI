/**
 * POST /api/chat — the single endpoint the frontend talks to.
 *
 * Persists the user turn, streams the assistant turn back as SSE, then persists
 * the completed assistant turn. The client never learns which provider answered.
 *
 * Identity comes from the signed session cookie (lib/session.ts) — any
 * client-supplied userId is ignored.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getSessionUserId } from "@/lib/session";
import {
  streamChatCompletion,
  generateTitle,
  hasAnyProviderConfigured,
  AllProvidersFailedError,
  type ChatMessage,
  type EffortLevel,
} from "@/lib/modelRouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Streaming can legitimately run for minutes on Max/Ultra effort. Self-hosted
// servers ignore this; hosts with a platform timeout (e.g. Vercel) honor it.
export const maxDuration = 300;

const FAILURE_MESSAGE =
  "I'm having trouble reaching my knowledge services right now. Every route I tried was busy or unavailable. Please try again in a moment — your conversation is safely saved.";

const NO_KEYS_MESSAGE = `Teja Priyan AI isn't connected to a model yet. You have two options:

**Option 1 — 100% free, no API key (recommended)**

Run models locally with [Ollama](https://ollama.com/download):

\`\`\`bash
ollama pull qwen3:8b     # great all-round chat model
ollama pull gemma3:4b    # small + handles images
\`\`\`

Ollama serves on port 11434 automatically. Refresh this page and I'll pick it up — no key, no quota, works offline.

**Option 2 — a free cloud key**

Add \`GROQ_API_KEY\` or \`GOOGLE_API_KEY\` to your \`.env\` file and restart. Both are free and need no credit card — see the README for links.`;

/** How many past messages feed the model, per effort tier. */
const HISTORY_WINDOW: Record<EffortLevel, number> = {
  fast: 30,
  think: 50,
  max: 80,
  ultra: 80,
};

const MAX_TEXT_CHARS = 32_000;
/** 4 MB file → ~5.33 MB base64 + data-URL overhead; 6.5M chars is a safe ceiling. */
const MAX_IMAGE_CHARS = 6_500_000;
const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp|gif);base64,/;

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const {
    chatId,
    message,
    image,
    effort = "fast",
    regenerate = false,
    history: clientHistory,
  } = await req.json().catch(() => ({}));

  /* ---------------------------- auth ----------------------------------- */
  const userId = getSessionUserId(req);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  /* -------------------------- validation ------------------------------- */
  const text = typeof message === "string" ? message : "";
  // Regenerate requests carry no new message — the last user turn is replayed.
  if (!regenerate && !text.trim() && !image) {
    return new Response("Empty message", { status: 400 });
  }
  if (text.length > MAX_TEXT_CHARS) {
    return new Response("Message too long (max 32,000 characters)", { status: 413 });
  }
  if (image) {
    if (typeof image !== "string" || !IMAGE_DATA_URL.test(image) || image.length > MAX_IMAGE_CHARS) {
      return new Response("Invalid or oversized image", { status: 413 });
    }
  }

  /* -------------------------- rate limit -------------------------------- */
  const limit = checkRateLimit(userId);
  if (!limit.ok) {
    return new Response(
      sse("error", {
        message: `You're sending messages a little too quickly. Please wait ${limit.retryAfter}s and try again.`,
      }),
      { status: 429, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  /* ---------------------- resolve / create the chat --------------------- */
  let activeChatId = chatId || "";
  try {
    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, name: "Friend" },
      update: {},
    }).catch(() => null);

    let chat = chatId
      ? await prisma.chat.findUnique({ where: { id: chatId } }).catch(() => null)
      : null;
    // Ownership check: never let a user write into someone else's thread.
    if (chat && chat.userId !== userId) chat = null;
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          id: chatId || undefined,
          userId,
        },
      }).catch(() => null);
    }
    if (chat) activeChatId = chat.id;
  } catch (err) {
    console.warn("[/api/chat] DB chat resolve/create failed, using ephemeral id:", err);
  }
  if (!activeChatId) activeChatId = chatId || `c_${Date.now()}`;

  /* ------------------------- persist user turn -------------------------- */
  try {
    if (regenerate) {
      // Drop the trailing assistant message so we can produce a fresh one.
      const last = await prisma.message.findFirst({
        where: { chatId: activeChatId },
        orderBy: { createdAt: "desc" },
      });
      if (last?.role === "assistant") {
        await prisma.message.delete({ where: { id: last.id } });
      }
    } else {
      await prisma.message.create({
        data: {
          chatId: activeChatId,
          role: "user",
          content: text,
          imageData: image ?? null,
        },
      });
    }
  } catch (err) {
    console.warn("[/api/chat] DB user turn persist failed (e.g. read-only filesystem):", err);
  }

  /* --------------------- build the model conversation ------------------- */
  let history: { role: string; content: string; imageData?: string | null }[] = [];
  try {
    const recent = await prisma.message.findMany({
      where: { chatId: activeChatId },
      orderBy: { createdAt: "desc" },
      take: HISTORY_WINDOW[effort as EffortLevel] ?? 30,
    });
    history = recent.reverse();
  } catch {
    // If DB is offline or read-only on serverless, fallback to client-supplied history
    history = [];
  }

  // Resilient memory: If DB history is empty or fewer turns than clientHistory,
  // utilize clientHistory (crucial for serverless environments with read-only SQLite)
  if (Array.isArray(clientHistory) && clientHistory.length > 0 && clientHistory.length >= history.length) {
    const sanitized = clientHistory
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({
        role: m.role as string,
        content: m.content as string,
        imageData: typeof m.imageData === "string" ? m.imageData : null,
      }));
    if (sanitized.length > 0) {
      history = sanitized.slice(-(HISTORY_WINDOW[effort as EffortLevel] ?? 30));
    }
  }

  // Ensure current user turn is at the end of history if not already present
  if (!regenerate && (text || image)) {
    const last = history[history.length - 1];
    if (!last || last.role !== "user" || last.content !== text) {
      history.push({ role: "user", content: text, imageData: image ?? null });
    }
  }

  if (history.length === 0) {
    history = [{ role: "user", content: text, imageData: image ?? null }];
  }

  let keptImage = false;
  const modelMessages: ChatMessage[] = history.map((m, i) => {
    const isLatestUserImage =
      !keptImage && i === history.length - 1 && m.role === "user" && !!m.imageData;
    keptImage = keptImage || isLatestUserImage;
    return {
      role: m.role as "user" | "assistant",
      content: m.content,
      image: isLatestUserImage ? m.imageData : null,
    };
  });

  let isFirstTurn = false;
  try {
    const userCount = await prisma.message.count({
      where: { chatId: activeChatId, role: "user" },
    });
    isFirstTurn = userCount === 1;
  } catch {
    // If DB is offline or read-only, infer first-turn status from the in-memory history
    isFirstTurn = history.filter((m) => m.role === "user").length <= 1;
  }

  /* ------------------------------ stream -------------------------------- */
  // Title generation runs CONCURRENTLY with the answer instead of serially
  // after it — the extra provider round-trip no longer delays the stream.
  let titlePromise: Promise<string> | null = null;
  if (isFirstTurn && !regenerate) {
    const firstUser = history.find((m) => m.role === "user");
    if (firstUser) {
      const source = firstUser.content || "Image";
      // Instant title generation — zero network latency, zero API rate limits
      titlePromise = Promise.resolve(generateTitle(source));
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: string, d: unknown) =>
        controller.enqueue(encoder.encode(sse(e, d)));

      send("meta", { chatId: activeChatId });

      if (!(await hasAnyProviderConfigured())) {
        send("token", { text: NO_KEYS_MESSAGE });
        try {
          await prisma.message.create({
            data: { chatId: activeChatId, role: "assistant", content: NO_KEYS_MESSAGE },
          });
        } catch (err) {
          console.warn("[/api/chat] Could not persist no-keys message to DB:", err);
        }
        send("done", { chatId: activeChatId });
        controller.close();
        return;
      }

      let full = "";
      try {
        const tokens = await streamChatCompletion(
          modelMessages,
          effort as EffortLevel,
          req.signal
        );
        for await (const t of tokens) {
          if (req.signal.aborted) break;
          full += t;
          send("token", { text: t });
        }
      } catch (err) {
        if (!req.signal.aborted) {
          const msg =
            err instanceof AllProvidersFailedError
              ? FAILURE_MESSAGE
              : "Something went wrong while reaching my services. Please try again in a moment.";
          console.error("[/api/chat]", err);
          send("error", { message: msg });
        }
      }

      // Persist whatever was produced (partial answers included, like ChatGPT).
      if (full.trim()) {
        try {
          await prisma.message.create({
            data: { chatId: activeChatId, role: "assistant", content: full },
          });
          await prisma.chat.update({
            where: { id: activeChatId },
            data: { updatedAt: new Date() },
          });
        } catch (err) {
          console.warn("[/api/chat] Could not persist assistant message to DB:", err);
        }
      }

      // Auto-title from the first user message.
      if (titlePromise) {
        try {
          const title = await titlePromise;
          await prisma.chat.update({ where: { id: activeChatId }, data: { title } }).catch(() => null);
          send("title", { chatId: activeChatId, title });
        } catch {
          /* heuristic fallback already applied inside generateTitle */
        }
      }

      send("done", { chatId: activeChatId });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
