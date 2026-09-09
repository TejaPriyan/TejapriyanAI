"use client";
/**
 * Left sidebar: new chat, search, pinned chats at top, chat list with
 * hover rename/delete/pin. Becomes a slide-over drawer below `lg`.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatSummary } from "@/lib/types";
import {
  IconPlus, IconTrash, IconPencil, IconClose, IconSearch,
  IconPin, IconPinOff,
} from "./Icons";

type Props = {
  chats: ChatSummary[];
  activeId: string | null;
  loading: boolean;
  open: boolean;
  userName: string;
  query: string;
  onQuery: (q: string) => void;
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  pinnedIds: Set<string>;
};

function ChatRow({
  chat, active, pinned, onSelect, onRename, onDelete, onPin,
}: {
  chat: ChatSummary;
  active: boolean;
  pinned: boolean;
  onSelect: () => void;
  onRename: (t: string) => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chat.title);

  const commit = () => {
    setEditing(false);
    const t = draft.trim();
    if (t && t !== chat.title) onRename(t);
    else setDraft(chat.title);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.18 }}
      className={`group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition
        ${active
          ? "bg-sand-200/80 text-sand-900 dark:bg-sand-700/60 dark:text-white"
          : "text-sand-600 hover:bg-sand-200/50 dark:text-sand-300 dark:hover:bg-sand-800/70"}`}
    >
      {pinned && (
        <span className="shrink-0 text-clay-500 dark:text-clay-400">
          <IconPin className="h-3 w-3" />
        </span>
      )}

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(chat.title); setEditing(false); }
          }}
          className="w-full rounded bg-white px-1.5 py-0.5 text-sm outline-none ring-2 ring-clay-500 dark:bg-sand-900"
        />
      ) : (
        <>
          <button onClick={onSelect} className="flex-1 truncate text-left" title={chat.title}>
            {chat.title}
          </button>
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onPin}
              aria-label={pinned ? "Unpin chat" : "Pin chat"}
              title={pinned ? "Unpin" : "Pin to top"}
              className={`rounded p-1 transition ${
                pinned
                  ? "text-clay-500 hover:bg-clay-100 dark:hover:bg-clay-900/30"
                  : "hover:bg-sand-300/70 dark:hover:bg-sand-600/70"
              }`}
            >
              {pinned
                ? <IconPinOff className="h-3.5 w-3.5" />
                : <IconPin className="h-3.5 w-3.5" />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setEditing(true)}
              aria-label="Rename chat"
              className="rounded p-1 hover:bg-sand-300/70 dark:hover:bg-sand-600/70"
            >
              <IconPencil className="h-3.5 w-3.5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onDelete}
              aria-label="Delete chat"
              className="rounded p-1 text-red-500 hover:bg-red-500/15"
            >
              <IconTrash className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
}

function Skeletons() {
  return (
    <div className="space-y-2 px-1 pt-1">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="skeleton h-8" style={{ width: `${70 + ((i * 13) % 30)}%` }} />
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-3">
      <span className="label text-sand-400 dark:text-sand-500">{children}</span>
    </div>
  );
}

export function Sidebar(p: Props) {
  const pinned = p.chats.filter((c) => p.pinnedIds.has(c.id));
  const unpinned = p.chats.filter((c) => !p.pinnedIds.has(c.id));

  const body = (
    <div className="relative flex h-full w-[280px] flex-col border-r border-sand-200 bg-sand-100/70 backdrop-blur-xl dark:border-sand-800 dark:bg-sand-900/50">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 min-w-[32px] max-w-[32px] min-h-[32px] max-h-[32px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sand-900 ring-1 ring-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/tp-logo.png"
            alt="Teja Priyan AI"
            width={32}
            height={32}
            className="h-full w-full object-contain"
            style={{ width: 32, height: 32, maxWidth: 32, maxHeight: 32 }}
          />
        </div>
        <div className="flex-1 leading-tight">
          <div className="font-display text-[17px] leading-tight">Teja Priyan AI</div>
          <div className="truncate text-[11px] text-sand-500 dark:text-sand-400">
            {p.userName || "Guest"}
          </div>
        </div>
        <button
          onClick={p.onClose}
          className="rounded-lg p-1.5 text-sand-500 hover:bg-sand-200 dark:hover:bg-sand-800 lg:hidden"
          aria-label="Close sidebar"
        >
          <IconClose className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* New chat */}
      <div className="px-3">
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          onClick={p.onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sand-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sand-800 dark:bg-white dark:text-sand-900 dark:hover:bg-sand-200"
        >
          <IconPlus className="h-4 w-4" /> New chat
        </motion.button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
          <input
            value={p.query}
            onChange={(e) => p.onQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full rounded-lg border border-sand-200 bg-white py-2 pl-8 pr-3 text-sm outline-none transition focus:border-clay-500 focus:ring-2 focus:ring-clay-500/20 dark:border-sand-700 dark:bg-sand-900"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="scroll-thin mt-2 flex-1 overflow-y-auto pb-4">
        {p.loading ? (
          <div className="px-2 pt-1"><Skeletons /></div>
        ) : p.chats.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-sand-400">
            {p.query ? "No chats match your search." : "No conversations yet."}
          </p>
        ) : (
          <>
            {/* Pinned section */}
            <AnimatePresence>
              {pinned.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SectionLabel>Pinned</SectionLabel>
                  <div className="space-y-1 px-2">
                    <AnimatePresence initial={false}>
                      {pinned.map((c) => (
                        <ChatRow
                          key={c.id}
                          chat={c}
                          active={c.id === p.activeId}
                          pinned
                          onSelect={() => p.onSelect(c.id)}
                          onRename={(t) => p.onRename(c.id, t)}
                          onDelete={() => p.onDelete(c.id)}
                          onPin={() => p.onPin(c.id, false)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                  {unpinned.length > 0 && (
                    <div className="mx-3 mt-2 border-t border-sand-200 dark:border-sand-800" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recents section */}
            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && <SectionLabel>Recent</SectionLabel>}
                <div className="space-y-1 px-2">
                  <AnimatePresence initial={false}>
                    {unpinned.map((c) => (
                      <ChatRow
                        key={c.id}
                        chat={c}
                        active={c.id === p.activeId}
                        pinned={false}
                        onSelect={() => p.onSelect(c.id)}
                        onRename={(t) => p.onRename(c.id, t)}
                        onDelete={() => p.onDelete(c.id)}
                        onPin={() => p.onPin(c.id, true)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-sand-200 px-4 py-3 text-[11px] text-sand-400 dark:border-sand-800">
        Teja Priyan AI can make mistakes. Verify important information.
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: persistent, animated width */}
      <motion.aside
        initial={false}
        animate={{ width: p.open ? 280 : 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="hidden shrink-0 overflow-hidden lg:block"
      >
        {body}
      </motion.aside>

      {/* Mobile: drawer */}
      <AnimatePresence>
        {p.open && (
          <div className="lg:hidden">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={p.onClose}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50"
            >
              {body}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
