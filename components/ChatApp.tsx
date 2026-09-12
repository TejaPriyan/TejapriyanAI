"use client";
/**
 * ChatApp — top-level client container. Owns identity, chat list, the active
 * thread and the SSE streaming loop against /api/chat.
 *
 * Upgrades:
 *  - Aurora + grain background (same as landing page)
 *  - Animated welcome screen with greeting and format hints
 *  - Keyboard shortcuts: Ctrl+K = new chat, Esc = stop generation
 *  - Dynamic browser tab title (shows active chat name)
 *  - Pin/unpin chats (stored in localStorage)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Composer } from "./Composer";
import { NameModal } from "./NameModal";
import { useTheme } from "./ThemeProvider";
import { exportChat } from "@/lib/exportChat";
import type { ChatSummary, EffortLevel, UiMessage } from "@/lib/types";
import {
  IconMenu, IconSun, IconMoon, IconSpark, IconDownload, IconPlus, IconHome,
} from "./Icons";

// Markdown parsing and code highlighting are only needed once a reply is visible.
// Keeping them out of the first chat-page bundle makes the initial transition faster.
const MessageBubble = dynamic(
  () => import("./MessageBubble").then((module) => module.MessageBubble),
  { ssr: false }
);

const LS_USER          = "tp_user";
const LS_EFFORT        = "tp_effort";
const LS_PINS          = "tp_pins";
const LS_CONVERSATIONS = "tp_user_conversations_v1";
const MAX_OFFLINE_HOURS = 12;

export default function ChatApp() {
  const { theme, toggle } = useTheme();

  const [user,         setUser]         = useState<{ id: string; name: string } | null>(null);
  const [ready,        setReady]        = useState(false);
  const [chats,        setChats]        = useState<ChatSummary[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [activeId,     setActiveId]     = useState<string | null>(null);
  const [messages,     setMessages]     = useState<UiMessage[]>([]);
  const [threadLoading,setThreadLoading]= useState(false);
  const [streaming,    setStreaming]    = useState(false);
  const [effort,       setEffort]       = useState<EffortLevel>("fast");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [query,        setQuery]        = useState("");
  const [pinnedIds,    setPinnedIds]    = useState<Set<string>>(new Set());
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [editingName,    setEditingName]    = useState(false);

  const abortRef     = useRef<AbortController | null>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const exportMenuRef= useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const chatCacheRef = useRef(new Map<string, UiMessage[]>());
  const threadRequestRef = useRef(0);

  /* ── dynamic tab title ── */
  const activeTitle = useMemo(
    () => chats.find((c) => c.id === activeId)?.title ?? "New chat",
    [chats, activeId]
  );
  useEffect(() => {
    document.title = activeId
      ? `${activeTitle} — Teja Priyan AI`
      : "Teja Priyan AI — Intelligence, without the friction";
  }, [activeTitle, activeId]);

  /* ── bootstrap ── */
  // Identity lives in a signed httpOnly session cookie; localStorage is only
  // a cache for the display name. On boot we restore from the session, and if
  // the cookie is gone but we still have a stored id, we silently re-register
  // so returning users never lose their chats.
  useEffect(() => {
    let stored: { id: string; name: string } | null = null;
    try {
      const raw = localStorage.getItem(LS_USER);
      if (raw) stored = JSON.parse(raw);
      const e = localStorage.getItem(LS_EFFORT) as EffortLevel | null;
      if (e) setEffort(e);
      const pins = localStorage.getItem(LS_PINS);
      if (pins) setPinnedIds(new Set(JSON.parse(pins)));
    } catch {}
    setSidebarOpen(window.innerWidth >= 1024);

    // Restore saved conversations or prune if user was offline for hours
    try {
      const rawConv = localStorage.getItem(LS_CONVERSATIONS);
      if (rawConv) {
        const parsedConv = JSON.parse(rawConv);
        const lastActive = Number(parsedConv.lastActive) || 0;
        const hoursOffline = (Date.now() - lastActive) / (1000 * 60 * 60);
        if (hoursOffline > MAX_OFFLINE_HOURS) {
          // Remove conversation cache after hours of inactivity
          localStorage.removeItem(LS_CONVERSATIONS);
        } else {
          if (Array.isArray(parsedConv.chats) && parsedConv.chats.length > 0) {
            setChats(parsedConv.chats);
            setChatsLoading(false);
          }
          if (parsedConv.messagesByChat && typeof parsedConv.messagesByChat === "object") {
            for (const [cId, msgs] of Object.entries(parsedConv.messagesByChat)) {
              if (Array.isArray(msgs)) {
                chatCacheRef.current.set(cId, msgs as UiMessage[]);
              }
            }
          }
        }
      }
    } catch {}

    if (stored) {
      setUser(stored);
      setReady(true); // Instant load for returning visitors — zero spinner wait
    }

    // Unconditional safety fallback: ensure the app NEVER stays stuck on BootScreen
    const safetyTimer = setTimeout(() => {
      setReady(true);
    }, 800);

    (async () => {
      try {
        const res = await fetch("/api/user", { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const u = await res.json();
          if (u?.id) {
            setUser(u);
            try { localStorage.setItem(LS_USER, JSON.stringify(u)); } catch {}
            setReady(true);
            clearTimeout(safetyTimer);
            return;
          }
        }
        // No live session — silently re-establish one for a returning visitor.
        if (stored) {
          const r = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: stored.name, userId: stored.id }),
            signal: AbortSignal.timeout(2000),
          });
          if (r.ok) {
            const u = await r.json();
            if (u?.id) {
              setUser(u);
              try { localStorage.setItem(LS_USER, JSON.stringify(u)); } catch {}
            }
          }
        }
      } catch (err) {
        console.warn("[ChatApp] Session bootstrap resolved via fallback:", err);
      } finally {
        clearTimeout(safetyTimer);
        setReady(true);
      }
    })();

    return () => clearTimeout(safetyTimer);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_EFFORT, effort); } catch {}
  }, [effort]);

  // Recently opened conversations switch instantly instead of waiting for a second fetch.
  useEffect(() => {
    if (activeId) chatCacheRef.current.set(activeId, messages);
    setExportMenuOpen(false);
  }, [activeId, messages]);

  // Persist conversation cache to localStorage while active; automatically expires after hours offline
  useEffect(() => {
    if (!user) return;
    try {
      const cacheObj: Record<string, UiMessage[]> = {};
      chatCacheRef.current.forEach((val, key) => {
        cacheObj[key] = val;
      });
      if (activeId && messages.length > 0) {
        cacheObj[activeId] = messages;
      }
      localStorage.setItem(
        LS_CONVERSATIONS,
        JSON.stringify({
          lastActive: Date.now(),
          chats,
          messagesByChat: cacheObj,
        })
      );
    } catch {}
  }, [user, chats, activeId, messages]);

  // Maintain active heartbeat timestamp while user interacts
  useEffect(() => {
    const touchActive = () => {
      try {
        const raw = localStorage.getItem(LS_CONVERSATIONS);
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.lastActive = Date.now();
          localStorage.setItem(LS_CONVERSATIONS, JSON.stringify(parsed));
        }
      } catch {}
    };
    window.addEventListener("beforeunload", touchActive);
    window.addEventListener("pointerdown", touchActive, { passive: true });
    return () => {
      window.removeEventListener("beforeunload", touchActive);
      window.removeEventListener("pointerdown", touchActive);
    };
  }, []);

  // Click outside to close export menu
  useEffect(() => {
    if (!exportMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [exportMenuOpen]);

  /* ── pin helpers ── */
  const pinChat = useCallback((id: string, pinned: boolean) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      pinned ? next.add(id) : next.delete(id);
      try { localStorage.setItem(LS_PINS, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K → new chat
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        newChat();
      }
      // Esc → stop generation
      if (e.key === "Escape" && streaming) {
        abortRef.current?.abort();
        setStreaming(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [streaming]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── identity ── */
  const registerName = useCallback(async (name: string) => {
    let legacyId: string | undefined;
    try {
      const raw = localStorage.getItem(LS_USER);
      if (raw) legacyId = JSON.parse(raw).id;
    } catch {}

    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, userId: legacyId }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const u = await res.json();
        if (u?.id) {
          setUser(u);
          try { localStorage.setItem(LS_USER, JSON.stringify(u)); } catch {}
          return;
        }
      }
    } catch (err) {
      console.warn("[ChatApp] /api/user error, applying client session fallback:", err);
    }

    // Resilient fallback: ensure user enters chat immediately without sticking
    const fallback = { id: legacyId || `u_${Date.now()}`, name };
    setUser(fallback);
    try { localStorage.setItem(LS_USER, JSON.stringify(fallback)); } catch {}
  }, []);

  /* ── chat list ── */
  const loadChats = useCallback(
    async (q = "") => {
      if (!user) return;
      try {
        const url = `/api/chats${q ? `?q=${encodeURIComponent(q)}` : ""}`;
        const res  = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setChats(data.chats ?? []);
        }
      } catch (err) {
        console.warn("[ChatApp] loadChats failed:", err);
      } finally {
        setChatsLoading(false);
      }
    },
    [user]
  );

  useEffect(() => { if (user) loadChats(); }, [user, loadChats]);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => loadChats(query), 220);
    return () => clearTimeout(t);
  }, [query, user, loadChats]);

  /* ── thread ── */
  const openChat = useCallback(async (id: string) => {
    if (!user) return;
    const requestId = ++threadRequestRef.current;
    const cached = chatCacheRef.current.get(id);
    setActiveId(id);
    setMessages(cached ?? []);
    setThreadLoading(!cached);
    if (window.innerWidth < 1024) setSidebarOpen(false);
    try {
      const res = await fetch(`/api/chats/${id}`);
      const data = await res.json();
      if (requestId !== threadRequestRef.current) return;
      const nextMessages = (data.chat?.messages ?? []).map((m: any) => ({
        id: m.id, role: m.role, content: m.content, imageData: m.imageData,
      }));
      chatCacheRef.current.set(id, nextMessages);
      setMessages(nextMessages);
    } finally {
      if (requestId === threadRequestRef.current) setThreadLoading(false);
    }
  }, [user]);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(null);
    setMessages([]);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  const renameChat = useCallback(async (id: string, title: string) => {
    if (!user) return;
    setChats((cs) => cs.map((c) => (c.id === id ? { ...c, title } : c)));
    await fetch(`/api/chats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }, [user]);

  const deleteChat = useCallback(
    async (id: string) => {
      if (!user) return;
      setChats((cs) => cs.filter((c) => c.id !== id));
      chatCacheRef.current.delete(id);
      pinChat(id, false);
      if (id === activeId) { setActiveId(null); setMessages([]); }
      await fetch(`/api/chats/${id}`, { method: "DELETE" });
    },
    [activeId, pinChat, user]
  );

  /* ── autoscroll ── */
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useEffect(() => {
    if (stickToBottom.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  /* ── streaming ── */
  const runStream = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!user) return;
      const controller  = new AbortController();
      abortRef.current  = controller;
      setStreaming(true);
      stickToBottom.current = true;

      const assistantId = `a-${Date.now()}`;
      setMessages((m) => [...m, { id: assistantId, role: "assistant", content: "" }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ effort, ...payload }),
          signal: controller.signal,
        });
        // Session expired (30-day cookie): ask for the name again — the same
        // account is re-attached, so no history is lost.
        if (res.status === 401) {
          setUser(null);
          throw new Error("Session expired — please tell me your name again.");
        }
        if (!res.body) throw new Error("No stream");

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let createdChatId: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const frames = buf.split("\n\n");
          buf = frames.pop() ?? "";

          for (const frame of frames) {
            const evLine   = frame.split("\n").find((l) => l.startsWith("event:"));
            const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            const event = evLine?.slice(6).trim() ?? "message";
            let data: any;
            try { data = JSON.parse(dataLine.slice(5).trim()); } catch { continue; }

            if (event === "meta" && data.chatId) {
              createdChatId = data.chatId;
              setActiveId((cur) => cur ?? data.chatId);
            } else if (event === "token") {
              setMessages((m) =>
                m.map((x) => (x.id === assistantId ? { ...x, content: x.content + data.text } : x))
              );
            } else if (event === "title") {
              setChats((cs) =>
                cs.some((c) => c.id === data.chatId)
                  ? cs.map((c) => (c.id === data.chatId ? { ...c, title: data.title } : c))
                  : cs
              );
            } else if (event === "error") {
              setMessages((m) =>
                m.map((x) =>
                  x.id === assistantId
                    ? { ...x, content: x.content || data.message, error: true }
                    : x
                )
              );
            }
          }
        }
        if (createdChatId) loadChats(query);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          const friendly =
            typeof err?.message === "string" && err.message.startsWith("Session expired")
              ? err.message
              : "Something went wrong while reaching my services. Please try again in a moment.";
          setMessages((m) =>
            m.map((x) =>
              x.id === assistantId && !x.content
                ? { ...x, error: true, content: friendly }
                : x
            )
          );
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [user, effort, loadChats, query]
  );

  const send = useCallback(
    (text: string, image: string | null) => {
      // Collect continuous prior turns for uninterrupted multi-turn conversational memory
      const priorTurns = messages
        .filter((m) => !m.error && m.content)
        .slice(-20)
        .map((m) => ({
          role: m.role,
          content: m.content,
          imageData: m.imageData ?? null,
        }));
      priorTurns.push({ role: "user", content: text, imageData: image ?? null });

      setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: text, imageData: image }]);
      runStream({ chatId: activeId, message: text, image, history: priorTurns });
    },
    [activeId, messages, runStream]
  );

  const regenerate = useCallback(() => {
    const priorTurns = (
      messages[messages.length - 1]?.role === "assistant"
        ? messages.slice(0, -1)
        : messages
    )
      .filter((m) => !m.error && m.content)
      .slice(-20)
      .map((m) => ({
        role: m.role,
        content: m.content,
        imageData: m.imageData ?? null,
      }));

    setMessages((m) => (m[m.length - 1]?.role === "assistant" ? m.slice(0, -1) : m));
    runStream({ chatId: activeId, regenerate: true, history: priorTurns });
  }, [activeId, messages, runStream]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  /* ── render ── */
  if (!ready) return <BootScreen />;

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <NameModal
        open={!user || editingName}
        initialName={user?.name ?? ""}
        isEditing={Boolean(user && editingName)}
        onClose={() => setEditingName(false)}
        onSubmit={async (newName: string) => {
          await registerName(newName);
          setEditingName(false);
        }}
      />

      <Sidebar
        chats={chats}
        activeId={activeId}
        loading={chatsLoading}
        open={sidebarOpen}
        userName={user?.name ?? ""}
        query={query}
        onQuery={setQuery}
        onClose={() => setSidebarOpen(false)}
        onNew={newChat}
        onSelect={openChat}
        onRename={renameChat}
        onDelete={deleteChat}
        onPin={pinChat}
        pinnedIds={pinnedIds}
        onEditName={() => setEditingName(true)}
      />

      <main className="chat-surface relative flex min-w-0 flex-1 flex-col">
        {/* ── Aurora background (same as landing) ── */}
        <div className="aurora pointer-events-none absolute inset-0 z-0" />
        <div className="grain pointer-events-none absolute inset-0 z-0" />

        {/* ── Header ── */}
        <header className="relative z-10 flex items-center gap-2 border-b border-sand-200/80 bg-sand-50/70 px-3 py-2.5 backdrop-blur-xl dark:border-sand-800/80 dark:bg-sand-950/70 sm:px-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
            className="rounded-lg p-2 text-sand-500 transition hover:bg-sand-100/80 dark:hover:bg-sand-800"
          >
            <IconMenu className="h-5 w-5" />
          </motion.button>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-medium">{activeTitle}</h2>
            {user && <p className="truncate text-[11px] text-sand-400">Hi, {user.name} 👋</p>}
          </div>

          {/* Keyboard shortcut hint */}
          <span className="hidden rounded-md border border-sand-200 bg-sand-100/80 px-2 py-0.5 font-mono text-[10px] text-sand-400 dark:border-sand-700 dark:bg-sand-800/80 sm:inline">
            ⌘K new
          </span>

          <Link
            href="/"
            aria-label="Back to site"
            title="Back to site"
            className="rounded-lg p-2 text-sand-500 transition hover:bg-sand-100/80 hover:text-ink dark:hover:bg-sand-800 dark:hover:text-sand-100"
          >
            <IconHome className="h-5 w-5" />
          </Link>

          <div ref={exportMenuRef} className="relative">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setExportMenuOpen((v) => !v)}
              disabled={messages.length === 0}
              aria-label="Export chat"
              title="Export chat"
              className="rounded-lg p-2 text-sand-500 transition hover:bg-sand-100/80 disabled:opacity-40 dark:hover:bg-sand-800"
            >
              <IconDownload className="h-5 w-5" />
            </motion.button>

            <AnimatePresence>
              {exportMenuOpen && messages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-sand-200 bg-white p-1 shadow-lg dark:border-sand-800 dark:bg-sand-900"
                >
                  <button
                    onClick={() => {
                      exportChat(activeTitle, messages, "md");
                      setExportMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-sand-700 transition hover:bg-sand-100 dark:text-sand-300 dark:hover:bg-sand-800 text-left"
                  >
                    <span>Markdown</span>
                    <span className="ml-auto rounded bg-sand-100 px-1.5 py-0.5 font-mono text-[10px] text-sand-500 dark:bg-sand-800 dark:text-sand-400">
                      .md
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      exportChat(activeTitle, messages, "txt");
                      setExportMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-sand-700 transition hover:bg-sand-100 dark:text-sand-300 dark:hover:bg-sand-800 text-left"
                  >
                    <span>Plain Text</span>
                    <span className="ml-auto rounded bg-sand-100 px-1.5 py-0.5 font-mono text-[10px] text-sand-500 dark:bg-sand-800 dark:text-sand-400">
                      .txt
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }} whileHover={{ rotate: 12 }}
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-lg p-2 text-sand-500 transition hover:bg-sand-100/80 dark:hover:bg-sand-800"
          >
            {theme === "dark" ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
          </motion.button>
        </header>

        {/* ── Thread ── */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="scroll-thin relative z-10 flex-1 overflow-y-auto"
        >
          <div className="relative mx-auto w-full max-w-4xl space-y-6 px-3 py-6 sm:px-5">
            {threadLoading ? (
              <ThreadSkeleton />
            ) : messages.length === 0 ? (
              <EmptyState name={user?.name ?? ""} />
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    userName={user?.name ?? ""}
                    isLast={i === messages.length - 1}
                    streaming={streaming}
                    onRegenerate={m.role === "assistant" && !streaming ? regenerate : undefined}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        <div className="relative z-10">
          <Composer
            onSend={send}
            onStop={stop}
            streaming={streaming}
            effort={effort}
            onEffort={setEffort}
            disabled={!user}
          />
        </div>
      </main>
    </div>
  );
}

/* ── sub-views ── */

function BootScreen() {
  return (
    <div className="flex h-[100dvh] items-center justify-center">
      <div className="aurora pointer-events-none absolute inset-0" />
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="flex h-16 w-16 min-w-[64px] max-w-[64px] min-h-[64px] max-h-[64px] shrink-0 items-center justify-center rounded-2xl bg-sand-100 p-2 shadow-inner dark:bg-sand-800"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon.svg"
          alt="Teja Priyan AI"
          width={56}
          height={56}
          className="h-full w-full object-contain filter drop-shadow-[0_4px_16px_rgba(56,189,248,0.4)]"
        />
      </motion.div>
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
          <div className="w-[70%] space-y-2">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-10 text-center sm:py-20"
    >
      {/* Animated Glowing TP Favicon Emblem */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative group mb-3"
      >
        <div className="absolute -inset-3 rounded-full bg-cyan-500/25 blur-2xl opacity-70 group-hover:opacity-100 transition duration-500" />
        <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 min-w-[80px] max-w-[96px] min-h-[80px] max-h-[96px] shrink-0 items-center justify-center rounded-3xl bg-sand-100/90 p-3 shadow-lg ring-1 ring-sand-200 backdrop-blur-md dark:bg-sand-800/80 dark:ring-sand-700">
          <img
            src="/favicon.svg"
            alt="Teja Priyan AI Emblem"
            width={96}
            height={96}
            className="h-full w-full object-contain filter drop-shadow-[0_4px_16px_rgba(56,189,248,0.4)]"
          />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="display mt-4 text-[2.2rem] font-normal leading-[1.1] text-sand-950 dark:text-white sm:text-[2.8rem]"
      >
        {name ? (
          <>
            How can I help you today,{" "}
            <span className="italic bg-gradient-to-r from-clay-500 to-amber-500 bg-clip-text text-transparent">
              {name}
            </span>
            ?
          </>
        ) : (
          "Where should we begin?"
        )}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="mt-2.5 max-w-md text-[14px] sm:text-[15px] text-sand-600 dark:text-sand-300 font-normal leading-relaxed"
      >
        Your intelligent workspace for deep thinking, analysis, and creative problem solving with continuous memory.
      </motion.p>

      {/* Keyboard shortcut hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-[11px] text-sand-400 dark:text-sand-500"
      >
        <kbd className="rounded border border-sand-200 px-1 font-mono dark:border-sand-700">⌘K</kbd>
        {" "}new chat &nbsp;·&nbsp;{" "}
        <kbd className="rounded border border-sand-200 px-1 font-mono dark:border-sand-700">Esc</kbd>
        {" "}stop generation
      </motion.p>
    </motion.div>
  );
}
