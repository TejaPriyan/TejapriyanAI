"use client";
/** A single chat turn: user right-aligned, assistant left-aligned with Markdown. */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Markdown } from "./Markdown";
import { IconCopy, IconCheck, IconRefresh, IconVolume, IconVolumeOff } from "./Icons";
import type { UiMessage } from "@/lib/types";

/* word + char count helper */
function countWords(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  return { words, chars };
}

/**
 * Split text into sentence-sized chunks for SpeechSynthesis.
 * Chrome silently stops speaking after ~250 words in a single utterance;
 * chunking by sentence boundaries avoids the cutoff.
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace.
  const raw = text.match(/[^.!?\n]+[.!?\n]+[\s]*/g);
  if (!raw) return text.trim() ? [text] : [];
  // Merge very short fragments with the previous chunk.
  const merged: string[] = [];
  for (const s of raw) {
    if (merged.length > 0 && merged[merged.length - 1].length < 40) {
      merged[merged.length - 1] += s;
    } else {
      merged.push(s);
    }
  }
  return merged;
}

/* spring config for message entrance */
const SPRING = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.8 };

export function MessageBubble({
  message, userName, isLast, streaming, onRegenerate,
}: {
  message: UiMessage;
  userName: string;
  isLast: boolean;
  streaming: boolean;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance[]>([]);
  const isUser = message.role === "user";

  /* stop speech if component unmounts or message changes */
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      utterRef.current = [];
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const toggleSpeak = () => {
    if (!window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      utterRef.current = [];
      setSpeaking(false);
      return;
    }

    // Split into sentence chunks to avoid Chrome/Safari silent cutoff.
    const chunks = splitIntoSentences(message.content);
    if (chunks.length === 0) return;

    const utterances = chunks.map((chunk, i) => {
      const utt = new SpeechSynthesisUtterance(chunk);
      utt.rate = 1.0;
      utt.pitch = 1.0;
      if (i === chunks.length - 1) {
        utt.onend = () => { setSpeaking(false); utterRef.current = []; };
        utt.onerror = () => { setSpeaking(false); utterRef.current = []; };
      }
      return utt;
    });

    utterRef.current = utterances;
    setSpeaking(true);
    for (const u of utterances) window.speechSynthesis.speak(u);
  };

  const { words, chars } = countWords(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={SPRING}
      className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="mt-1 flex h-8 w-8 min-w-[32px] max-w-[32px] min-h-[32px] max-h-[32px] shrink-0 items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/tp-logo.png"
            alt="Teja Priyan AI"
            width={32}
            height={32}
            className="h-full w-full object-contain filter drop-shadow-[0_2px_8px_rgba(56,189,248,0.3)]"
            style={{ width: 32, height: 32, maxWidth: 32, maxHeight: 32 }}
          />
        </motion.div>
      )}

      <div className={`group max-w-[min(52rem,90%)] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <motion.div
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.15 }}
          className={`rounded-2xl px-4 py-3 shadow-sm ring-1 transition
            ${isUser
              ? "rounded-br-md bg-sand-100 text-sand-950 ring-1 ring-sand-200 shadow-sm dark:bg-sand-800/90 dark:text-sand-50 dark:ring-sand-700"
              : "rounded-bl-md bg-white/95 text-sand-900 ring-1 ring-sand-200/90 shadow-sm backdrop-blur-md dark:bg-sand-900/80 dark:text-sand-100 dark:ring-sand-800"}`}
        >
          {message.imageData && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={message.imageData}
              alt="Attached"
              className="mb-2 max-h-64 rounded-xl border border-white/20 object-contain"
            />
          )}

          {isUser ? (
            <p className="whitespace-pre-wrap text-[16px] leading-7">{message.content}</p>
          ) : message.content ? (
            <div className={streaming && isLast ? "caret" : ""}>
              <Markdown content={message.content} />
            </div>
          ) : (
            <ThinkingDots />
          )}
        </motion.div>

        {/* Action buttons — visible on touch, hover on desktop */}
        {message.content && !(streaming && isLast) && (
          <div
            className={`mt-1.5 flex items-center gap-1 transition-opacity
              ${isUser
                ? "opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100"
                : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"}`}
          >
            <ActionBtn onClick={copy} label={copied ? "Copied!" : "Copy"}>
              {copied
                ? <IconCheck className="h-3.5 w-3.5 text-green-500" />
                : <IconCopy className="h-3.5 w-3.5" />}
            </ActionBtn>

            {!isUser && (
              <>
                <ActionBtn onClick={toggleSpeak} label={speaking ? "Stop" : "Read aloud"}>
                  {speaking
                    ? <IconVolumeOff className="h-3.5 w-3.5 text-clay-500" />
                    : <IconVolume className="h-3.5 w-3.5" />}
                </ActionBtn>

                <ActionBtn onClick={() => setShowStats((v) => !v)} label="Word count">
                  <span className="font-mono text-[10px]">{words}w</span>
                </ActionBtn>
              </>
            )}

            {!isUser && isLast && onRegenerate && (
              <ActionBtn onClick={onRegenerate} label="Regenerate">
                <IconRefresh className="h-3.5 w-3.5" />
              </ActionBtn>
            )}
          </div>
        )}

        {/* Stats pill */}
        {showStats && !isUser && message.content && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 overflow-hidden"
          >
            <span className="rounded-md bg-sand-100 px-2 py-0.5 font-mono text-[11px] text-sand-500 dark:bg-sand-800 dark:text-sand-400">
              {words} words · {chars} chars
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function ActionBtn({
  onClick, label, children,
}: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-sand-500 transition hover:bg-sand-200 hover:text-sand-800 dark:text-sand-400 dark:hover:bg-sand-700 dark:hover:text-sand-100"
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-sand-400 dark:bg-sand-500"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
