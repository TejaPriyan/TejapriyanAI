"use client";
/**
 * Markdown renderer for assistant replies: GFM tables/lists, syntax-highlighted
 * fenced code blocks each with their own "copy code" button, and LaTeX math
 * equations rendered via KaTeX.
 */
import { memo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import { motion } from "framer-motion";
import { IconCopy, IconCheck } from "./Icons";

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }, [getText]);

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={copy}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-sand-300 transition hover:bg-white/10 hover:text-white"
      aria-label="Copy code"
    >
      {copied ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </motion.button>
  );
}

/** Recursively flatten a React node tree to plain text (for the copy button). */
function nodeText(node: any): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (node.props?.children) return nodeText(node.props.children);
  return "";
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
          pre: ({ children }) => {
            const text = nodeText(children);
            const lang =
              /language-([\w-]+)/.exec(
                (children as any)?.props?.className ?? ""
              )?.[1] ?? "code";
            return (
              <div className="group overflow-hidden rounded-xl border border-sand-800 bg-[#0d1117] shadow-sm">
                <div className="flex items-center justify-between border-b border-sand-800 bg-[#161b22] px-3 py-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-sand-400">
                    {lang}
                  </span>
                  <CopyButton getText={() => text} />
                </div>
                <pre className="text-sand-100">{children}</pre>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export const Markdown = memo(MarkdownImpl);
