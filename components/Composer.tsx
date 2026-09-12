"use client";
/**
 * Auto-expanding composer: Enter sends / Shift+Enter newlines, image upload +
 * drag-and-drop with client-side canvas compression, optional voice dictation,
 * and the Fast/Think/Max/Ultra effort selector.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { EffortLevel } from "@/lib/types";
import {
  IconSend, IconStop, IconImage, IconClose, IconMic,
  IconZap,
} from "./Icons";

const EFFORTS: { id: EffortLevel; label: string; hint: string; badge: string; desc: string }[] = [
  { id: "fast",  label: "Fast",  hint: "Ultra-fast direct answers with minimal latency", badge: "⚡ Fast", desc: "Ultra-fast response · Low latency direct answers" },
  { id: "think", label: "Think", hint: "Step-by-step logic and structured reasoning", badge: "🧠 Think", desc: "Structured step-by-step reasoning · Balanced depth" },
  { id: "max",   label: "Max",   hint: "Deep architectural synthesis & comprehensive solutions", badge: "⚡ Max", desc: "Deep technical synthesis & edge cases · High reasoning" },
  { id: "ultra", label: "Ultra", hint: "Maximum cognitive depth · Full proofs & complete code", badge: "🔥 Ultra", desc: "Maximum cognitive depth · Full proofs & complete code" },
];

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Client-side image downscaling to prevent huge base64 payload in SQLite */
async function compressImage(file: File, maxDim = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      const rawUrl = String(fr.result);
      if (file.type === "image/svg+xml" || file.size < 80 * 1024) {
        resolve(rawUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(rawUrl);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(rawUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
          resolve(canvas.toDataURL(mimeType, quality));
        } catch {
          resolve(rawUrl);
        }
      };
      img.src = rawUrl;
    };
    fr.readAsDataURL(file);
  });
}

export function Composer({
  onSend, onStop, streaming, effort, onEffort, disabled,
}: {
  onSend: (text: string, image: string | null) => void;
  onStop: () => void;
  streaming: boolean;
  effort: EffortLevel;
  onEffort: (e: EffortLevel) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);

  // Auto-grow textarea up to ~9 rows
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 220) + "px";
  }, [text]);

  const readFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return setNotice("Only image files are supported.");
    if (file.size > MAX_IMAGE_BYTES) return setNotice("Image is too large (max 4 MB).");
    try {
      const compressed = await compressImage(file);
      setImage(compressed);
    } catch {
      const fr = new FileReader();
      fr.onload = () => setImage(String(fr.result));
      fr.readAsDataURL(file);
    }
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(t);
  }, [notice]);

  const submit = () => {
    if (streaming || disabled) return;
    const t = text.trim();
    if (!t && !image) return;

    onSend(t, image);
    setText("");
    setImage(null);
  };

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return setNotice("Voice input isn't supported in this browser.");
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    let base = text;
    rec.onresult = (e: any) => {
      let str = "";
      for (let i = e.resultIndex; i < e.results.length; i++) str += e.results[i][0].transcript;
      setText((base ? base + " " : "") + str);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const isUltra = effort === "ultra";

  return (
    <div className="mx-auto w-full max-w-3xl px-2 pb-2 pt-1 sm:px-4 sm:pb-4 sm:pt-2">
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-2 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stop generating */}
      <AnimatePresence>
        {streaming && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="mb-2 flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              onClick={onStop}
              className="flex items-center gap-2 rounded-full border border-sand-300 bg-white px-4 py-1.5 text-xs font-medium shadow-sm dark:border-sand-600 dark:bg-sand-800"
            >
              <IconStop className="h-3.5 w-3.5" /> Stop generating
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          borderColor: dragging
            ? "rgb(51,130,251)"
            : isUltra
            ? "rgb(249,115,22)"
            : undefined,
          scale: dragging ? 1.008 : 1,
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) readFile(f);
        }}
        className={`rounded-2xl border bg-white shadow-lg shadow-sand-200/50 transition dark:bg-sand-900 dark:shadow-black/30
          ${isUltra
            ? "border-clay-400/60 dark:border-clay-600/60"
            : "border-sand-200 dark:border-sand-700"}`}
      >
        {/* Image preview */}
        <AnimatePresence>
          {image && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden px-3 pt-3"
            >
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Attachment preview" className="h-20 w-20 rounded-lg border border-sand-200 object-cover dark:border-sand-700" />
                <button
                  onClick={() => setImage(null)}
                  aria-label="Remove image"
                  className="absolute -right-2 -top-2 rounded-full bg-sand-900 p-1 text-white shadow dark:bg-sand-200 dark:text-sand-900"
                >
                  <IconClose className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-1.5 p-1.5 sm:gap-2 sm:p-2.5">
          <input
            ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ""; }}
          />
          <IconBtn label="Attach image" onClick={() => fileRef.current?.click()}>
            <IconImage className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </IconBtn>
          <IconBtn label="Voice input" onClick={toggleVoice} active={listening}>
            <IconMic className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </IconBtn>

          <textarea
            ref={taRef}
            rows={1}
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            onPaste={(e) => {
              const f = Array.from(e.clipboardData.files)[0];
              if (f) { e.preventDefault(); readFile(f); }
            }}
            placeholder={
              dragging
                ? "Drop your image here…"
                : "Message Teja Priyan AI…"
            }
            className="scroll-thin max-h-[130px] sm:max-h-[220px] flex-1 resize-none bg-transparent py-1.5 sm:py-2 text-[16px] sm:text-[15px] leading-snug sm:leading-6 outline-none placeholder:text-sand-400"
          />

          <motion.button
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
            onClick={streaming ? onStop : submit}
            disabled={!streaming && !text.trim() && !image}
            aria-label={streaming ? "Stop generating" : "Send message"}
            className={`mb-0.5 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl text-white shadow transition disabled:cursor-not-allowed disabled:bg-sand-300 dark:disabled:bg-sand-700
              ${isUltra ? "bg-clay-500 hover:bg-clay-600" : "bg-clay-500 hover:bg-clay-600"}`}
          >
            {streaming ? <IconStop className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <IconSend className="h-4 w-4 sm:h-4.5 sm:w-4.5" />}
          </motion.button>
        </div>

        {/* Effort selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-t border-sand-100 px-2 py-1 sm:px-3 sm:py-2 dark:border-sand-800">
          <span className="text-[10px] sm:text-[11px] font-medium text-sand-400">Depth</span>
          <div className="relative flex rounded-lg bg-sand-100 p-0.5 dark:bg-sand-800">
            {EFFORTS.map((e) => {
              const active = effort === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => onEffort(e.id)}
                  title={e.hint}
                  className={`relative rounded-md px-2 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-[12px] font-medium transition ${
                    active
                      ? e.id === "ultra"
                        ? "text-clay-700 dark:text-clay-300 font-semibold"
                        : e.id === "max"
                        ? "text-indigo-700 dark:text-indigo-300 font-semibold"
                        : e.id === "think"
                        ? "text-sky-700 dark:text-sky-300 font-semibold"
                        : "text-emerald-700 dark:text-emerald-300 font-semibold"
                      : "text-sand-500 hover:text-sand-700 dark:hover:text-sand-300"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="effort-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className={`absolute inset-0 rounded-md shadow-sm ${
                        e.id === "ultra"
                          ? "bg-clay-100 dark:bg-clay-950/60"
                          : e.id === "max"
                          ? "bg-indigo-100 dark:bg-indigo-950/60"
                          : e.id === "think"
                          ? "bg-sky-100 dark:bg-sky-950/60"
                          : "bg-emerald-100 dark:bg-emerald-950/60"
                      }`}
                    />
                  )}
                  <span className="relative flex items-center gap-1">
                    {e.id === "ultra" ? (
                      <IconZap className="h-3 w-3 text-clay-600 dark:text-clay-400" />
                    ) : e.id === "max" ? (
                      <span className="text-[10px]">⚡</span>
                    ) : e.id === "think" ? (
                      <span className="text-[10px]">🧠</span>
                    ) : (
                      <span className="text-[10px]">⚡</span>
                    )}
                    {e.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Depth status indicator — responsive for mobile & desktop */}
          <AnimatePresence mode="wait">
            <motion.span
              key={effort}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={`text-[10px] sm:text-[11px] font-medium truncate ${
                effort === "ultra"
                  ? "font-semibold text-clay-600 dark:text-clay-400"
                  : effort === "max"
                  ? "font-semibold text-indigo-600 dark:text-indigo-400"
                  : effort === "think"
                  ? "text-sky-600 dark:text-sky-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <span className="hidden md:inline">
                {EFFORTS.find((e) => e.id === effort)?.desc}
              </span>
              <span className="inline md:hidden">
                {EFFORTS.find((e) => e.id === effort)?.badge}
              </span>
            </motion.span>
          </AnimatePresence>

          <span className="ml-auto hidden text-[11px] text-sand-400 lg:block">
            Enter to send · Shift+Enter for newline
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function IconBtn({
  children, label, onClick, active,
}: { children: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
      onClick={onClick} aria-label={label} title={label}
      className={`mb-0.5 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl transition ${
        active
          ? "bg-red-500/15 text-red-500"
          : "text-sand-500 hover:bg-sand-100 hover:text-sand-800 dark:hover:bg-sand-800 dark:hover:text-sand-200"
      }`}
    >
      {children}
    </motion.button>
  );
}
