"use client";
/**
 * Interactive File Workspace & Live Code Sandbox (ChatGPT / Claude Style)
 * Supports:
 * - Multi-file project workspace (index.html, style.css, script.js, etc.)
 * - File tree explorer: create, rename, delete, download, and switch files
 * - Code Editor with line numbers, tab indent, and instant saving
 * - Live Sandboxed Preview: bundles HTML + CSS + JS into an isolated iframe
 * - View Modes: Code | Live Preview | Side-by-Side Split
 * - Viewport Switcher: Desktop (100%) vs Mobile (375px frame)
 * - "Download Project (.zip)" with zero external dependencies via pure PKZip builder
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WorkspaceFile } from "@/lib/types";
import { downloadProjectZip } from "@/lib/zipHelper";
import {
  IconClose,
  IconCode,
  IconPlay,
  IconColumns,
  IconCopy,
  IconCheck,
  IconDownload,
  IconRefresh,
  IconExternal,
  IconPlus,
  IconTrash,
  IconPencil,
  IconFolder,
  IconFile,
  IconSave,
} from "./Icons";

export interface WorkspaceProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  onProjectNameChange?: (name: string) => void;
  files: WorkspaceFile[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onUpdateFile: (fileId: string, updates: Partial<WorkspaceFile>) => void;
  onCreateFile: (name: string, content?: string) => void;
  onDeleteFile: (fileId: string) => void;
}

/** Determine file badge styling based on extension */
function getFileBadge(name: string): { label: string; color: string } {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "html":
    case "htm":
      return { label: "HTML", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
    case "css":
      return { label: "CSS", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    case "js":
      return { label: "JS", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    case "ts":
      return { label: "TS", color: "bg-sky-500/20 text-sky-400 border-sky-500/30" };
    case "jsx":
    case "tsx":
      return { label: "REACT", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" };
    case "json":
      return { label: "JSON", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    case "py":
      return { label: "PY", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    case "md":
      return { label: "MD", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
    default:
      return { label: ext.toUpperCase() || "FILE", color: "bg-sand-800 text-sand-400 border-sand-700" };
  }
}

/** Bundles multiple workspace files into a single self-contained HTML preview document */
function buildSandboxBundle(files: WorkspaceFile[]): string {
  const htmlFile = files.find((f) => f.name.endsWith(".html") || f.name.endsWith(".htm"));
  const cssFiles = files.filter((f) => f.name.endsWith(".css"));
  const jsFiles = files.filter((f) => f.name.endsWith(".js") || f.name.endsWith(".ts"));

  // Combined CSS rules
  const cssContent = cssFiles.map((f) => `/* ${f.name} */\n${f.content}`).join("\n\n");

  // Combined JS scripts
  const jsContent = jsFiles.map((f) => `// ${f.name}\n${f.content}`).join("\n\n");

  let baseHtml = htmlFile?.content || "";

  // If no HTML file is present, generate a responsive container for CSS and JS
  if (!baseHtml.trim()) {
    const isSvg = files.some((f) => f.name.endsWith(".svg") || f.content.includes("<svg"));
    if (isSvg) {
      const svgFile = files.find((f) => f.name.endsWith(".svg")) || files[0];
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#090d16;}</style></head><body>${svgFile.content}</body></html>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Preview</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; background: #0b0f19; color: #f8fafc; }
    ${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="app"></div>
  <script>
    ${jsContent}
  </script>
</body>
</html>`;
  }

  // Inject CSS stylesheets before </head> or at start
  if (cssContent.trim()) {
    const styleTag = `<style>\n${cssContent}\n</style>`;
    if (baseHtml.includes("</head>")) {
      baseHtml = baseHtml.replace("</head>", `  ${styleTag}\n</head>`);
    } else {
      baseHtml = `${styleTag}\n${baseHtml}`;
    }
  }

  // Inject JavaScript before </body> or at end
  if (jsContent.trim()) {
    const scriptTag = `<script>\ntry {\n${jsContent}\n} catch (err) { console.error("Runtime Error:", err); }\n</script>`;
    if (baseHtml.includes("</body>")) {
      baseHtml = baseHtml.replace("</body>", `  ${scriptTag}\n</body>`);
    } else {
      baseHtml = `${baseHtml}\n${scriptTag}`;
    }
  }

  return baseHtml;
}

export function Workspace({
  open,
  onClose,
  projectName,
  onProjectNameChange,
  files,
  activeFileId,
  onSelectFile,
  onUpdateFile,
  onCreateFile,
  onDeleteFile,
}: WorkspaceProps) {
  const [viewMode, setViewMode] = useState<"code" | "preview" | "split">("preview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const [newFileModal, setNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0] || null;
  }, [files, activeFileId]);

  const [codeDraft, setCodeDraft] = useState(activeFile?.content || "");

  useEffect(() => {
    if (activeFile) {
      setCodeDraft(activeFile.content);
    }
  }, [activeFile?.id, activeFile?.content, activeFile]);

  // Generate multi-file sandbox doc
  const sandboxDoc = useMemo(() => {
    return buildSandboxBundle(files);
  }, [files]);

  // Handle explicit save action
  const handleSave = useCallback(() => {
    if (!activeFile) return;
    onUpdateFile(activeFile.id, { content: codeDraft, updatedAt: Date.now() });
    setSaveStatus("Saved");
    setTimeout(() => setSaveStatus(null), 1800);
  }, [activeFile, codeDraft, onUpdateFile]);

  // Keyboard shortcut Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Download entire project as a ZIP archive
  const handleDownloadZip = () => {
    if (files.length === 0) return;
    downloadProjectZip(
      projectName || "my-project",
      files.map((f) => ({ name: f.name, content: f.content }))
    );
    setSaveStatus("Project Downloaded!");
    setTimeout(() => setSaveStatus(null), 2000);
  };

  // Download individual active file
  const handleDownloadFile = (file: WorkspaceFile) => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy active file content
  const handleCopyCode = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(codeDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  // Pop out preview to a new native browser tab
  const handlePopOut = () => {
    const blob = new Blob([sandboxDoc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // Create new file submit
  const handleCreateSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = newFileName.trim();
    if (!name) return;
    onCreateFile(name, "");
    setNewFileName("");
    setNewFileModal(false);
  };

  // Commit file rename
  const commitRename = (id: string) => {
    const next = renameDraft.trim();
    if (next) {
      onUpdateFile(id, { name: next });
    }
    setRenamingId(null);
  };

  if (!open) return null;

  return (
    <div className="relative flex h-full w-full flex-col border-l border-sand-200 bg-sand-950 text-sand-100 shadow-2xl dark:border-sand-800">
      {/* ── Top Workspace Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand-800/80 bg-[#121620] px-3 py-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 font-semibold text-sand-200">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-clay-600/30 text-clay-400">
              <IconFolder className="h-3.5 w-3.5" />
            </span>
            <span className="truncate max-w-[140px] sm:max-w-[220px] font-mono text-xs text-white">
              {projectName || "project"}
            </span>
            <span className="rounded bg-sand-800 px-1.5 py-0.5 text-[10px] text-sand-400">
              {files.length} {files.length === 1 ? "file" : "files"}
            </span>
          </div>

          {/* Toggle File Sidebar button */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            title="Toggle File Explorer"
            className="rounded p-1 text-sand-400 hover:bg-sand-800 hover:text-sand-200 transition"
          >
            <IconColumns className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center rounded-lg bg-sand-900/90 p-0.5 border border-sand-800">
          <button
            onClick={() => setViewMode("code")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
              viewMode === "code"
                ? "bg-sand-800 text-white shadow-sm"
                : "text-sand-400 hover:text-sand-200"
            }`}
          >
            <IconCode className="h-3.5 w-3.5" /> Code
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
              viewMode === "preview"
                ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/30"
                : "text-cyan-400 hover:text-cyan-300"
            }`}
          >
            <IconPlay className="h-3.5 w-3.5" /> Live Preview
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`hidden sm:flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
              viewMode === "split"
                ? "bg-sand-800 text-white shadow-sm"
                : "text-sand-400 hover:text-sand-200"
            }`}
          >
            <IconColumns className="h-3.5 w-3.5" /> Split
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Download Entire Project */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleDownloadZip}
            title="Download Project (.zip)"
            className="flex items-center gap-1.5 rounded-lg border border-sand-700 bg-sand-800/80 px-2.5 py-1 text-[11px] font-medium text-sand-200 transition hover:bg-clay-600 hover:text-white"
          >
            <IconDownload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download Project</span>
          </motion.button>

          {/* Close Workspace */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onClose}
            aria-label="Close workspace"
            title="Close workspace"
            className="rounded-lg p-1.5 text-sand-400 transition hover:bg-sand-800 hover:text-white"
          >
            <IconClose className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* ── Main Workspace Body ── */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left File Explorer ── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 190, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex shrink-0 flex-col border-r border-sand-800/80 bg-[#0d1017] text-xs"
            >
              {/* Explorer Header & New File button */}
              <div className="flex items-center justify-between border-b border-sand-800/60 px-3 py-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-sand-400">
                  Files
                </span>
                <button
                  onClick={() => setNewFileModal(true)}
                  title="Create new file"
                  className="rounded p-1 text-sand-400 hover:bg-sand-800 hover:text-white transition"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* File list */}
              <div className="scroll-thin flex-1 overflow-y-auto py-1">
                {files.map((f) => {
                  const badge = getFileBadge(f.name);
                  const isActive = f.id === activeFile?.id;
                  const isRenaming = renamingId === f.id;

                  return (
                    <div
                      key={f.id}
                      onClick={() => onSelectFile(f.id)}
                      className={`group flex items-center justify-between gap-1.5 px-3 py-1.5 text-[12px] cursor-pointer transition ${
                        isActive
                          ? "bg-sand-800/90 text-white font-medium"
                          : "text-sand-400 hover:bg-sand-850 hover:text-sand-200"
                      }`}
                    >
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onBlur={() => commitRename(f.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(f.id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="w-full rounded bg-sand-900 px-1 py-0.5 text-xs text-white outline-none ring-1 ring-clay-500"
                        />
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <span
                              className={`rounded border px-1 py-0.2 text-[9px] font-mono font-semibold ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                            <span className="truncate font-mono text-[11px]">{f.name}</span>
                          </div>

                          {/* Hover Actions: Rename / Delete */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingId(f.id);
                                setRenameDraft(f.name);
                              }}
                              title="Rename file"
                              className="rounded p-0.5 hover:bg-sand-700 text-sand-400 hover:text-sand-200"
                            >
                              <IconPencil className="h-3 w-3" />
                            </button>
                            {files.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteFile(f.id);
                                }}
                                title="Delete file"
                                className="rounded p-0.5 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300"
                              >
                                <IconTrash className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Workspace Center Area (Editor / Preview / Split) ── */}
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden bg-[#070a12]">
          {/* Split Mode: Side-by-Side */}
          {viewMode === "split" ? (
            <div className="grid h-full w-full grid-cols-2 divide-x divide-sand-800">
              {/* Left: Code Editor */}
              <div className="flex h-full flex-col min-w-0">
                <EditorHeader
                  activeFile={activeFile}
                  codeDraft={codeDraft}
                  copied={copied}
                  saveStatus={saveStatus}
                  onSave={handleSave}
                  onCopy={handleCopyCode}
                  onDownload={() => activeFile && handleDownloadFile(activeFile)}
                />
                <EditorArea
                  codeDraft={codeDraft}
                  setCodeDraft={setCodeDraft}
                  onSave={handleSave}
                />
              </div>

              {/* Right: Live Preview */}
              <div className="flex h-full flex-col min-w-0 bg-[#090d16]">
                <PreviewHeader
                  viewport={viewport}
                  setViewport={setViewport}
                  onRefresh={() => setRefreshKey((k) => k + 1)}
                  onPopOut={handlePopOut}
                />
                <PreviewIframe
                  key={refreshKey}
                  doc={sandboxDoc}
                  viewport={viewport}
                />
              </div>
            </div>
          ) : viewMode === "code" ? (
            /* Code Only Mode */
            <div className="flex h-full flex-col min-w-0">
              <EditorHeader
                activeFile={activeFile}
                codeDraft={codeDraft}
                copied={copied}
                saveStatus={saveStatus}
                onSave={handleSave}
                onCopy={handleCopyCode}
                onDownload={() => activeFile && handleDownloadFile(activeFile)}
              />
              <EditorArea
                codeDraft={codeDraft}
                setCodeDraft={setCodeDraft}
                onSave={handleSave}
              />
            </div>
          ) : (
            /* Live Preview Only Mode */
            <div className="flex h-full flex-col min-w-0 bg-[#090d16]">
              <PreviewHeader
                viewport={viewport}
                setViewport={setViewport}
                onRefresh={() => setRefreshKey((k) => k + 1)}
                onPopOut={handlePopOut}
              />
              <PreviewIframe
                key={refreshKey}
                doc={sandboxDoc}
                viewport={viewport}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── New File Modal Dialog ── */}
      <AnimatePresence>
        {newFileModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-xl border border-sand-700 bg-sand-900 p-5 shadow-2xl"
            >
              <h3 className="font-display text-base font-semibold text-white">Create New File</h3>
              <p className="mt-1 text-xs text-sand-400">
                Enter filename with extension (e.g. `style.css`, `script.js`, `component.html`)
              </p>

              <form onSubmit={handleCreateSubmit} className="mt-4">
                <input
                  autoFocus
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="filename.ext"
                  className="w-full rounded-lg border border-sand-700 bg-sand-950 px-3 py-2 text-sm text-white outline-none focus:border-clay-500 focus:ring-2 focus:ring-clay-500/20"
                />

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewFileModal(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-sand-400 hover:bg-sand-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newFileName.trim()}
                    className="rounded-lg bg-clay-600 px-3.5 py-1.5 text-xs font-medium text-white shadow transition hover:bg-clay-500 disabled:opacity-50"
                  >
                    Create File
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Editor Subcomponents ── */

function EditorHeader({
  activeFile,
  codeDraft,
  copied,
  saveStatus,
  onSave,
  onCopy,
  onDownload,
}: {
  activeFile: WorkspaceFile | null;
  codeDraft: string;
  copied: boolean;
  saveStatus: string | null;
  onSave: () => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const lineCount = useMemo(() => codeDraft.split("\n").length, [codeDraft]);

  return (
    <div className="flex items-center justify-between border-b border-sand-800/80 bg-[#121620] px-3 py-1.5 text-xs">
      <div className="flex items-center gap-2">
        <IconFile className="h-3.5 w-3.5 text-sand-400" />
        <span className="font-mono text-xs font-semibold text-sand-200">
          {activeFile?.name || "Untitled"}
        </span>
        <span className="text-[10px] text-sand-400">
          {lineCount} lines · {codeDraft.length} chars
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Save feedback indicator */}
        {saveStatus && (
          <span className="text-[11px] font-medium text-emerald-400 animate-pulse">
            {saveStatus}
          </span>
        )}

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onSave}
          title="Save changes (Ctrl+S)"
          className="flex items-center gap-1 rounded bg-clay-600/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm hover:bg-clay-500 transition"
        >
          <IconSave className="h-3 w-3" /> Save
        </motion.button>

        {/* Copy */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onCopy}
          title="Copy file code"
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-sand-300 hover:bg-sand-800 transition"
        >
          {copied ? <IconCheck className="h-3 w-3 text-emerald-400" /> : <IconCopy className="h-3 w-3" />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </motion.button>

        {/* Download file */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onDownload}
          title="Download file"
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-sand-300 hover:bg-sand-800 transition"
        >
          <IconDownload className="h-3 w-3" />
        </motion.button>
      </div>
    </div>
  );
}

function EditorArea({
  codeDraft,
  setCodeDraft,
  onSave,
}: {
  codeDraft: string;
  setCodeDraft: (c: string) => void;
  onSave: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key inserts 2 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      const next = val.substring(0, start) + "  " + val.substring(end);
      setCodeDraft(next);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      }, 0);
    }
  };

  const lines = useMemo(() => codeDraft.split("\n"), [codeDraft]);

  return (
    <div className="relative flex flex-1 min-h-0 overflow-hidden bg-[#070a12] font-mono text-[13px] leading-6">
      {/* Line Numbers gutter */}
      <div className="select-none overflow-hidden bg-[#0a0e1a] py-3 pl-3 pr-2 text-right font-mono text-xs text-sand-600">
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Code Textarea Editor */}
      <textarea
        ref={textareaRef}
        value={codeDraft}
        onChange={(e) => setCodeDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className="scroll-thin flex-1 resize-none bg-transparent p-3 text-sand-100 outline-none selection:bg-clay-600/40"
      />
    </div>
  );
}

/* ── Preview Subcomponents ── */

function PreviewHeader({
  viewport,
  setViewport,
  onRefresh,
  onPopOut,
}: {
  viewport: "desktop" | "mobile";
  setViewport: (v: "desktop" | "mobile") => void;
  onRefresh: () => void;
  onPopOut: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-sand-800/80 bg-[#121620] px-3 py-1.5 text-xs">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          Live Sandbox
        </span>

        {/* Viewport switch: Desktop vs Mobile */}
        <div className="ml-2 flex rounded bg-sand-900/90 p-0.5 border border-sand-800">
          <button
            onClick={() => setViewport("desktop")}
            className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${
              viewport === "desktop" ? "bg-sand-800 text-white" : "text-sand-400 hover:text-sand-200"
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${
              viewport === "mobile" ? "bg-sand-800 text-white" : "text-sand-400 hover:text-sand-200"
            }`}
          >
            Mobile (375px)
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onRefresh}
          title="Reload Preview"
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-sand-300 hover:bg-sand-800 transition"
        >
          <IconRefresh className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onPopOut}
          title="Open in new native browser tab"
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-cyan-400 hover:bg-cyan-950/40 transition"
        >
          <IconExternal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Pop Out</span>
        </motion.button>
      </div>
    </div>
  );
}

function PreviewIframe({
  doc,
  viewport,
}: {
  doc: string;
  viewport: "desktop" | "mobile";
}) {
  return (
    <div className="flex flex-1 items-center justify-center overflow-auto p-2 bg-[#080c16]">
      <div
        className={`h-full transition-all duration-300 ${
          viewport === "mobile"
            ? "w-[375px] max-w-full rounded-2xl border-4 border-sand-800 shadow-2xl overflow-hidden bg-black"
            : "w-full"
        }`}
      >
        <iframe
          title="Interactive Code Preview Sandbox"
          srcDoc={doc}
          sandbox="allow-scripts allow-modals allow-same-origin"
          className="h-full w-full border-0 bg-transparent"
        />
      </div>
    </div>
  );
}
