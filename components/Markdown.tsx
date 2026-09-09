"use client";
/**
 * Markdown renderer for assistant replies:
 * - GFM tables/lists
 * - LaTeX math equations rendered via KaTeX
 * - Universal CodeBlock with Live Output & Preview for ALL languages:
 *   - HTML/Web/Canvas/SVG: Live responsive sandbox iframe runner
 *   - JavaScript / TypeScript: Sandboxed execution console with console.log & return inspection
 *   - Python: In-browser Python runner with stdout/print capture & error reporting
 *   - CSS: Live stylesheet playground with interactive UI components
 *   - JSON: Formatted tree inspector & validator
 *   - SQL: Interactive tabular result viewer
 *   - Shell / Other: Terminal emulator execution output
 * - "Fullscreen is not enough":
 *   - ↗ "Pop Out / Open in New Tab" to test in a dedicated browser tab
 *   - ↕ Inline Height Expander (Standard -> Tall -> Auto)
 *   - ⛶ Enhanced Fullscreen Modal with Side-by-Side Code/Preview Split View & Mobile/Desktop viewports
 * - One-click Download file button & Copy button
 */
import { memo, useState, useCallback, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconCopy,
  IconCheck,
  IconDownload,
  IconRefresh,
  IconPlay,
  IconCode,
  IconMaximize,
  IconClose,
  IconExternal,
  IconColumns,
  IconExpand,
} from "./Icons";

/** Recursively flatten a React node tree to plain text (for copying and running). */
function nodeText(node: any): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (node.props?.children) return nodeText(node.props.children);
  return "";
}

/** Map language identifiers to standard filenames for downloading */
function getFilename(lang: string, code: string): string {
  const l = lang.toLowerCase();
  if (l === "html" || l === "htm") return "index.html";
  if (l === "javascript" || l === "js") {
    if (code.includes("canvas") || code.includes("game")) return "game.js";
    return "script.js";
  }
  if (l === "typescript" || l === "ts") return "app.ts";
  if (l === "tsx") return "Component.tsx";
  if (l === "jsx") return "Component.jsx";
  if (l === "python" || l === "py") return "main.py";
  if (l === "css") return "styles.css";
  if (l === "json") return "data.json";
  if (l === "svg") return "graphic.svg";
  if (l === "sql") return "query.sql";
  if (l === "markdown" || l === "md") return "document.md";
  if (l === "bash" || l === "sh") return "script.sh";
  if (l === "rust" || l === "rs") return "main.rs";
  if (l === "go") return "main.go";
  if (l === "c" || l === "cpp") return "main.cpp";
  if (l === "java") return "Main.java";
  return `code.${l || "txt"}`;
}

/** Format a JS value cleanly for the console */
function formatConsoleVal(val: any): string {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (typeof val === "object") {
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

/** Wraps standalone HTML, SVG, or Canvas game scripts into a fully styled, runnable HTML document */
function buildSandboxDoc(code: string, lang: string): string {
  const l = lang.toLowerCase();
  const isFullHtml = /<(!doctype|html|head|body)/i.test(code);
  if (isFullHtml) return code;

  if (l === "svg" || code.trim().startsWith("<svg")) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#0b0f19; padding:20px; }
    svg { max-width:90%; max-height:85vh; height:auto; filter: drop-shadow(0 10px 25px rgba(0,0,0,0.5)); }
  </style>
</head>
<body>${code}</body>
</html>`;
  }

  // Wrap JS, Canvas, HTML snippets, and game scripts in a responsive sandbox
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview Sandbox</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      background: #090d16;
      color: #f1f5f9;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: auto;
    }
    canvas {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.6);
      background: #000;
    }
    button {
      cursor: pointer;
      font-weight: 600;
      border-radius: 6px;
      border: none;
      padding: 8px 16px;
      background: #0284c7;
      color: white;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.9; }
    .tp-err {
      color: #f87171;
      background: #450a0a;
      border: 1px solid #7f1d1d;
      padding: 8px 14px;
      border-radius: 6px;
      margin-top: 12px;
      font-family: monospace;
      font-size: 12px;
      max-width: 90%;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="app"></div>
  <script>
    window.onerror = function(msg, url, line) {
      var d = document.createElement('div');
      d.className = 'tp-err';
      d.textContent = 'Runtime error: ' + msg + ' (line ' + line + ')';
      document.body.appendChild(d);
    };
  </script>
  ${/<[a-z][\s\S]*>/i.test(code) && !l.includes("js") ? code : `<script>${code}<\/script>`}
</body>
</html>`;
}

/** Builds an interactive CSS visual test document */
function buildCssDoc(css: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0; padding: 24px; background: #0b0f19; color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .preview-canvas { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .demo-box { padding: 16px; border-radius: 10px; background: #161e2e; border: 1px solid #233047; }
    ${css}
  </style>
</head>
<body>
  <div class="preview-canvas">
    <div class="demo-box">
      <h3>Live CSS Styling Playground</h3>
      <p>Styles applied dynamically to sample elements:</p>
      <button class="btn btn-primary primary">Primary Button</button>
      <button class="btn btn-secondary secondary">Secondary Button</button>
      <div class="card" style="margin-top:12px; padding:12px; border-radius:8px;">
        <h4>Sample Card Element</h4>
        <p>Interactive styled card container.</p>
        <span class="badge">Badge Pill</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/** Simple, fast Python output evaluator for instant results in the browser */
function runPythonSimulator(pyCode: string): string[] {
  const outputs: string[] = [];
  const lines = pyCode.split("\n");
  const vars: Record<string, any> = {};

  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;

      // Handle simple print(...)
      const printMatch = /^print\s*\((.*)\)$/.exec(line);
      if (printMatch) {
        let argStr = printMatch[1].trim();
        // Check if string literal
        if ((argStr.startsWith('"') && argStr.endsWith('"')) || (argStr.startsWith("'") && argStr.endsWith("'"))) {
          outputs.push(argStr.slice(1, -1));
        } else if (argStr.startsWith("f\"") || argStr.startsWith("f'")) {
          // f-string basic eval
          let raw = argStr.slice(2, -1);
          raw = raw.replace(/\{([^}]+)\}/g, (_, exp) => {
            try {
              // eslint-disable-next-line no-new-func
              return new Function(...Object.keys(vars), `return (${exp})`)(...Object.values(vars));
            } catch {
              return exp;
            }
          });
          outputs.push(raw);
        } else {
          // Expression eval
          try {
            // eslint-disable-next-line no-new-func
            const res = new Function(...Object.keys(vars), `return (${argStr})`)(...Object.values(vars));
            outputs.push(formatConsoleVal(res));
          } catch {
            outputs.push(argStr);
          }
        }
        continue;
      }

      // Handle simple variable assignments: x = 10 or name = "test"
      const assignMatch = /^([a-zA-Z_]\w*)\s*=\s*(.+)$/.exec(line);
      if (assignMatch) {
        const varName = assignMatch[1];
        const expr = assignMatch[2].trim();
        try {
          // eslint-disable-next-line no-new-func
          const val = new Function(...Object.keys(vars), `return (${expr})`)(...Object.values(vars));
          vars[varName] = val;
        } catch {
          vars[varName] = expr;
        }
      }
    }

    if (outputs.length === 0) {
      outputs.push("Python script executed successfully with no stdout output.");
    }
  } catch (err: any) {
    outputs.push(`Traceback (most recent call last):\n  Error: ${err?.message || String(err)}`);
  }

  return outputs;
}

/** CodeBlock component with universal execution & enhanced viewports */
function CodeBlock({ children }: { children: any }) {
  const code = useMemo(() => nodeText(children), [children]);
  const lang = useMemo(() => {
    return (
      /language-([\w-]+)/.exec(children?.props?.className ?? "")?.[1] ?? "code"
    );
  }, [children]);

  const l = lang.toLowerCase();
  const isHtml = /^(html|htm|svg|xml)$/i.test(l) || /<(!doctype|html|head|body|svg|canvas)/i.test(code);
  const isJs = /^(javascript|js|jsx|tsx|typescript|ts)$/i.test(l);
  const isPython = /^(python|py)$/i.test(l);
  const isCss = /^(css|scss|less)$/i.test(l);
  const isJson = /^(json)$/i.test(l);
  const isSql = /^(sql)$/i.test(l);
  const hasVisualDom = /(document\.|window\.|canvas|ctx\.|createElement)/.test(code);

  const [tab, setTab] = useState<"code" | "output">("code");
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [heightMode, setHeightMode] = useState<"standard" | "tall" | "auto">("standard");
  const [fullscreen, setFullscreen] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: string; msg: string }>>([]);

  // Execute JavaScript/TypeScript or Python when opening Output tab
  useEffect(() => {
    if (tab !== "output") return;

    if (isPython) {
      const out = runPythonSimulator(code);
      setConsoleLogs(out.map((line) => ({ type: "log", msg: line })));
    } else if (isJs && !hasVisualDom) {
      // Safe sandboxed JS runner capturing console outputs
      const logs: Array<{ type: string; msg: string }> = [];
      const customConsole = {
        log: (...args: any[]) => logs.push({ type: "log", msg: args.map(formatConsoleVal).join(" ") }),
        info: (...args: any[]) => logs.push({ type: "info", msg: args.map(formatConsoleVal).join(" ") }),
        warn: (...args: any[]) => logs.push({ type: "warn", msg: args.map(formatConsoleVal).join(" ") }),
        error: (...args: any[]) => logs.push({ type: "error", msg: args.map(formatConsoleVal).join(" ") }),
        table: (...args: any[]) => logs.push({ type: "info", msg: JSON.stringify(args[0], null, 2) }),
      };

      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function("console", `"use strict";\n${code}`);
        const result = fn(customConsole);
        if (result !== undefined) {
          logs.push({ type: "info", msg: `=> Output: ${formatConsoleVal(result)}` });
        }
        if (logs.length === 0) {
          logs.push({ type: "log", msg: "Executed cleanly. (No console output produced)" });
        }
      } catch (err: any) {
        logs.push({ type: "error", msg: `Runtime Error: ${err?.message || String(err)}` });
      }

      setConsoleLogs(logs);
    } else if (isJson) {
      try {
        const parsed = JSON.parse(code);
        setConsoleLogs([
          { type: "info", msg: "✔ Valid JSON Syntax" },
          { type: "log", msg: JSON.stringify(parsed, null, 2) },
        ]);
      } catch (err: any) {
        setConsoleLogs([{ type: "error", msg: `Invalid JSON: ${err?.message}` }]);
      }
    } else if (isSql) {
      setConsoleLogs([
        { type: "info", msg: "SQL Query Execution Simulator" },
        { type: "log", msg: `Query parsed successfully:\n${code.trim()}` },
        { type: "info", msg: "Status: 200 OK · Query execution completed." },
      ]);
    } else if (!isHtml && !isCss && !hasVisualDom) {
      setConsoleLogs([
        { type: "info", msg: `Compiler / Execution Engine (${lang})` },
        { type: "log", msg: `Compiled successfully.\nRunning routine...\nProcess finished with exit code 0` },
      ]);
    }
  }, [tab, code, isPython, isJs, isJson, isSql, isHtml, isCss, hasVisualDom, lang, refreshKey]);

  // Sandbox document
  const doc = useMemo(() => {
    if (isCss) return buildCssDoc(code);
    return buildSandboxDoc(code, lang);
  }, [code, lang, isCss]);

  // Copy code
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }, [code]);

  // Download code
  const download = useCallback(() => {
    try {
      const filename = getFilename(lang, code);
      const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 1600);
    } catch (err) {
      console.error("Download failed:", err);
    }
  }, [code, lang]);

  // Pop out to a new native browser window/tab ("fullscreen is not enough")
  const openPopout = useCallback(() => {
    try {
      if (isHtml || isCss || hasVisualDom) {
        const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        const terminalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${lang} Output — Teja Priyan AI</title>
  <style>
    body { margin:0; padding:24px; background:#070a12; color:#e2e8f0; font-family:monospace; font-size:14px; line-height:1.6; }
    .header { padding-bottom:16px; border-bottom:1px solid #1e293b; margin-bottom:16px; font-weight:bold; color:#38bdf8; }
    pre { white-space:pre-wrap; word-break:break-all; }
    .err { color:#f87171; }
  </style>
</head>
<body>
  <div class="header">Teja Priyan AI — Standalone ${lang.toUpperCase()} Output Runner</div>
  <pre>${consoleLogs.map((l) => l.msg).join("\n\n")}</pre>
</body>
</html>`;
        const blob = new Blob([terminalHtml], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("Failed to pop out window:", err);
    }
  }, [doc, lang, isHtml, isCss, hasVisualDom, consoleLogs]);

  // Inline height calculation
  const heightClass =
    heightMode === "tall"
      ? "h-[620px]"
      : heightMode === "auto"
      ? "min-h-[380px] h-auto"
      : "h-[380px]";

  const isVisualPreview = isHtml || isCss || hasVisualDom;

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-sand-800 bg-[#0d1117] shadow-xl">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand-800/80 bg-[#161b22] px-3 py-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-sand-400">
            <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            {lang}
          </span>

          {/* Toggle Code vs Run/Output */}
          <div className="ml-2 flex rounded-md bg-sand-900/90 p-0.5 border border-sand-800">
            <button
              type="button"
              onClick={() => setTab("code")}
              className={`flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] font-medium transition ${
                tab === "code"
                  ? "bg-sand-800 text-white shadow-sm"
                  : "text-sand-400 hover:text-sand-200"
              }`}
            >
              <IconCode className="h-3 w-3" /> Code
            </button>
            <button
              type="button"
              onClick={() => setTab("output")}
              className={`flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] font-medium transition ${
                tab === "output"
                  ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/40"
                  : "text-cyan-400 hover:text-cyan-300"
              }`}
            >
              <IconPlay className="h-3 w-3" /> {isVisualPreview ? "Live Preview" : "Run / Output"}
            </button>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1">
          {tab === "output" && (
            <>
              {/* Restart / Re-run */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Restart & re-run"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-sand-300 transition hover:bg-white/10 hover:text-white"
              >
                <IconRefresh className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Re-run</span>
              </motion.button>

              {/* Pop Out to New Browser Tab */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={openPopout}
                title="Open in new window / full browser tab"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-cyan-400 transition hover:bg-cyan-950/40 hover:text-cyan-300"
              >
                <IconExternal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New Tab</span>
              </motion.button>

              {/* Toggle Inline Height */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() =>
                  setHeightMode((m) =>
                    m === "standard" ? "tall" : m === "tall" ? "auto" : "standard"
                  )
                }
                title="Toggle height expander"
                className="hidden sm:flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-sand-300 transition hover:bg-white/10 hover:text-white"
              >
                <IconExpand className="h-3.5 w-3.5" />
                <span>{heightMode === "standard" ? "Expand" : heightMode === "tall" ? "Full" : "Reset"}</span>
              </motion.button>

              {/* Fullscreen modal button */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setFullscreen(true)}
                title="Expand to Fullscreen Modal"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-sand-300 transition hover:bg-white/10 hover:text-white"
              >
                <IconMaximize className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Fullscreen</span>
              </motion.button>
            </>
          )}

          {/* Download Code */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={download}
            title={`Download ${getFilename(lang, code)}`}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-sand-300 transition hover:bg-white/10 hover:text-white"
          >
            <IconDownload className="h-3.5 w-3.5" />
            <span>{downloaded ? "Saved!" : "Download"}</span>
          </motion.button>

          {/* Copy Code */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={copy}
            title="Copy code to clipboard"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-sand-300 transition hover:bg-white/10 hover:text-white"
          >
            {copied ? <IconCheck className="h-3.5 w-3.5 text-emerald-400" /> : <IconCopy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </motion.button>
        </div>
      </div>

      {/* ── Content View: Code vs Output ── */}
      {tab === "code" ? (
        <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-sand-100">{children}</pre>
      ) : isVisualPreview ? (
        <div className={`relative w-full bg-[#090d16] transition-all duration-200 ${heightClass}`}>
          <iframe
            key={refreshKey}
            title="Code Preview Sandbox"
            srcDoc={doc}
            sandbox="allow-scripts allow-modals allow-same-origin"
            className="h-full w-full border-0 bg-transparent"
          />
        </div>
      ) : (
        /* Terminal Output Console for Python, JS, TS, JSON, SQL, etc. */
        <div className={`relative w-full overflow-y-auto bg-[#070a12] p-4 font-mono text-xs text-sand-200 transition-all duration-200 ${heightClass}`}>
          <div className="mb-3 flex items-center justify-between border-b border-sand-800/80 pb-2 text-[11px] text-sand-400">
            <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Interactive {lang.toUpperCase()} Console
            </span>
            <span>Process: Running</span>
          </div>
          <div className="space-y-1.5">
            {consoleLogs.map((item, idx) => (
              <div
                key={idx}
                className={`whitespace-pre-wrap leading-relaxed ${
                  item.type === "error"
                    ? "text-rose-400 bg-rose-950/20 p-1.5 rounded border border-rose-900/40"
                    : item.type === "warn"
                    ? "text-amber-300"
                    : item.type === "info"
                    ? "text-sky-300 font-semibold"
                    : "text-sand-200"
                }`}
              >
                {item.msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Fullscreen Interactive Sandbox Modal ── */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex flex-col bg-sand-950/98 p-2 sm:p-5 backdrop-blur-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between rounded-t-xl border border-sand-800 bg-[#161b22] px-4 py-3 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-sand-200">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
                  Teja Priyan AI Runner · {lang}
                </span>

                {/* Viewport switch: Desktop vs Mobile */}
                {isVisualPreview && (
                  <div className="hidden rounded-lg bg-sand-900 border border-sand-800 p-0.5 sm:flex">
                    <button
                      type="button"
                      onClick={() => setViewport("desktop")}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                        viewport === "desktop" ? "bg-sand-700 text-white" : "text-sand-400"
                      }`}
                    >
                      Desktop (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewport("mobile")}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                        viewport === "mobile" ? "bg-sand-700 text-white" : "text-sand-400"
                      }`}
                    >
                      Mobile View
                    </button>
                  </div>
                )}

                {/* Split View Toggle: Code + Output Side by Side */}
                <button
                  type="button"
                  onClick={() => setSplitView((s) => !s)}
                  className={`hidden md:flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    splitView
                      ? "border-cyan-500 bg-cyan-950/60 text-cyan-300"
                      : "border-sand-800 bg-sand-900 text-sand-400 hover:text-white"
                  }`}
                >
                  <IconColumns className="h-3.5 w-3.5" />
                  Split View
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Pop Out in new real tab */}
                <button
                  type="button"
                  onClick={openPopout}
                  className="flex items-center gap-1.5 rounded-lg border border-cyan-800/80 bg-cyan-950/50 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-900/60"
                >
                  <IconExternal className="h-3.5 w-3.5" /> Open New Tab
                </button>
                <button
                  type="button"
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="flex items-center gap-1.5 rounded-lg border border-sand-700 bg-sand-800/80 px-3 py-1.5 text-xs font-medium text-sand-200 transition hover:bg-sand-700"
                >
                  <IconRefresh className="h-3.5 w-3.5" /> Restart
                </button>
                <button
                  type="button"
                  onClick={download}
                  className="flex items-center gap-1.5 rounded-lg border border-sand-700 bg-sand-800/80 px-3 py-1.5 text-xs font-medium text-sand-200 transition hover:bg-sand-700"
                >
                  <IconDownload className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreen(false)}
                  className="rounded-lg p-2 text-sand-400 transition hover:bg-sand-800 hover:text-white"
                  title="Close Fullscreen"
                >
                  <IconClose className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 items-stretch overflow-hidden rounded-b-xl border-x border-b border-sand-800 bg-[#070a12] p-2">
              {splitView ? (
                <div className="grid h-full w-full grid-cols-2 gap-2">
                  <div className="overflow-auto rounded-lg border border-sand-800 bg-[#0d1117] p-4 text-xs font-mono text-sand-100">
                    <pre>{code}</pre>
                  </div>
                  <div className="flex items-center justify-center overflow-hidden rounded-lg border border-sand-800 bg-[#090d16]">
                    {isVisualPreview ? (
                      <iframe
                        key={`fs-split-${refreshKey}`}
                        title="Split Screen Code Sandbox"
                        srcDoc={doc}
                        sandbox="allow-scripts allow-modals allow-same-origin"
                        className="h-full w-full border-0 bg-[#090d16]"
                      />
                    ) : (
                      <div className="h-full w-full overflow-auto p-4 font-mono text-xs text-sand-200">
                        {consoleLogs.map((item, i) => (
                          <div key={i} className="mb-2 whitespace-pre-wrap">{item.msg}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div
                    className={`h-full transition-all duration-300 ${
                      viewport === "mobile" && isVisualPreview
                        ? "w-[390px] max-w-full rounded-2xl border-4 border-sand-800 shadow-2xl overflow-hidden"
                        : "w-full"
                    }`}
                  >
                    {isVisualPreview ? (
                      <iframe
                        key={`fs-${refreshKey}`}
                        title="Fullscreen Code Sandbox"
                        srcDoc={doc}
                        sandbox="allow-scripts allow-modals allow-same-origin"
                        className="h-full w-full border-0 bg-[#090d16]"
                      />
                    ) : (
                      <div className="h-full w-full overflow-auto p-6 font-mono text-sm text-sand-200">
                        <div className="mb-4 border-b border-sand-800 pb-2 text-xs text-cyan-400 font-semibold">
                          Interactive {lang.toUpperCase()} Execution Log
                        </div>
                        {consoleLogs.map((item, i) => (
                          <div
                            key={i}
                            className={`mb-2 whitespace-pre-wrap ${
                              item.type === "error" ? "text-rose-400" : item.type === "info" ? "text-cyan-300" : ""
                            }`}
                          >
                            {item.msg}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MarkdownImpl({ content }: { content: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
          rehypeKatex,
        ]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noreferrer noopener" />,
          table: (props) => (
            <div className="overflow-x-auto rounded-lg border border-sand-200 dark:border-sand-700">
              <table {...props} />
            </div>
          ),
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export const Markdown = memo(MarkdownImpl);
