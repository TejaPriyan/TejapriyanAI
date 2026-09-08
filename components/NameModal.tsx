"use client";
/** First-visit onboarding: asks only for a name. No password, no email. */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSpark } from "./Icons";

export function NameModal({ open, onSubmit }: { open: boolean; onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    await onSubmit(n);
    setBusy(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-sand-900/50 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="w-full max-w-md rounded-2xl border border-sand-200 bg-white p-7 shadow-2xl dark:border-sand-700 dark:bg-sand-900"
          >
            <motion.div
              initial={{ rotate: -12, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.08, type: "spring", stiffness: 260 }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-sand-50 shadow-lg dark:bg-sand-100 dark:text-ink"
            >
              <IconSpark className="h-7 w-7" />
            </motion.div>

            <h1 className="display mt-6 text-center text-[2rem] leading-tight">
              Welcome to <span className="italic text-clay-600 dark:text-clay-400">Teja Priyan AI</span>
            </h1>
            <p className="mt-2 text-center text-sm text-sand-500 dark:text-sand-400">
              What should I call you? No password, no email — just a name.
            </p>

            <input
              autoFocus
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
              placeholder="Your name"
              className="mt-6 w-full rounded-xl border border-sand-200 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-clay-500 focus:ring-4 focus:ring-clay-500/15 dark:border-sand-700 dark:bg-sand-800"
            />

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={go}
              disabled={!name.trim() || busy}
              className="mt-4 w-full rounded-xl bg-clay-600 py-3 text-sm font-semibold text-white shadow-lg shadow-clay-600/25 transition hover:bg-clay-700 disabled:cursor-not-allowed disabled:bg-sand-300 disabled:shadow-none dark:disabled:bg-sand-700"
            >
              {busy ? "Setting up…" : "Start chatting"}
            </motion.button>

            <p className="mt-4 text-center text-[11px] text-sand-400">
              Your name and chats stay on this device and its local database.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
