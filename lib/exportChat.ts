// Export the current thread as a .md Markdown or .txt transcript document.
import type { UiMessage } from "./types";

export type ExportFormat = "txt" | "md";

export function exportChat(
  title: string,
  messages: UiMessage[],
  format: ExportFormat = "md"
) {
  if (!messages.length) return;
  const safeTitle = title.replace(/[^\w\s-]/g, "").trim().slice(0, 50) || "chat";
  const dateStr = new Date().toLocaleString();

  let content = "";
  let mimeType = "";
  let extension = "";

  if (format === "md") {
    mimeType = "text/markdown;charset=utf-8";
    extension = "md";
    const header = `# ${title}\n\n*Exported from Teja Priyan AI on ${dateStr}*\n\n---\n\n`;
    const body = messages
      .map((m) => {
        const speaker = m.role === "user" ? "### 👤 You" : "### ✨ Teja Priyan AI";
        const img = m.imageData ? `\n\n![Uploaded Image](${m.imageData})\n` : "";
        return `${speaker}\n\n${m.content}${img}`;
      })
      .join("\n\n---\n\n");
    content = header + body + "\n";
  } else {
    mimeType = "text/plain;charset=utf-8";
    extension = "txt";
    const header = `${title}\nTeja Priyan AI — exported ${dateStr}\n${"=".repeat(60)}\n\n`;
    const body = messages
      .map(
        (m) =>
          `${m.role === "user" ? "You" : "Teja Priyan AI"}:\n${
            m.imageData ? "[image attached]\n" : ""
          }${m.content}\n`
      )
      .join("\n" + "-".repeat(60) + "\n\n");
    content = header + body;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeTitle}.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}
