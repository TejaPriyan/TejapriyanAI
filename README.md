# ⚡ Teja Priyan AI

> An advanced, full-stack multimodal AI workspace built for real-time streaming, interactive code & game execution, visual understanding, and deep cognitive reasoning.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-tejapriyan--ai.vercel.app-0070f3?style=for-the-badge&logo=vercel&logoColor=white)](https://tejapriyan-ai.vercel.app)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2d3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

🌐 **Live Website:** [https://tejapriyan-ai.vercel.app](https://tejapriyan-ai.vercel.app)

---

## ✨ Overview

**Teja Priyan AI** is an end-to-end artificial intelligence platform offering an intuitive, high-performance workspace designed for developers, creators, and researchers. 

Engineered with an autonomous multi-route failover architecture, the platform guarantees uninterrupted uptime by transparently routing requests across high-speed reasoning pipelines with zero downtime or service interruptions.

---

## 🚀 Key Features

* **⚡ Real-Time Streaming** — Instant token-by-token streaming with low latency and cancelable generation.
* **🎮 Interactive Live Code & Game Sandbox** — Fenced HTML, JavaScript, Canvas, SVG, and Game blocks render directly in an embedded preview tab with live restart, fullscreen preview, and one-click file download.
* **👁️ Visual Intelligence** — Upload, drag-and-drop, or paste images directly into the chat for instant visual reasoning and diagram interpretation.
* **🧠 Four Adaptive Cognitive Tiers**:
  * **Fast** — High-speed, direct responses with zero preamble.
  * **Think** — Structured detail and balanced reasoning.
  * **Max** — Deep architectural analysis, complex logic, and edge-case handling.
  * **Ultra** — Maximum cognitive depth, formal proofs, and comprehensive problem-solving.
* **🛡️ Autonomous Failover Engine** — Dynamic cognitive router that monitors route availability and reroutes instantly if a pipeline experiences rate limits or network issues.
* **🗂️ Chat Management & Search** — Full chat history, instant conversation search, title generation, pin to top, and conversation export (`.txt`).
* **📐 Rich Formatting** — Full GitHub-flavored Markdown, syntax-highlighted code blocks with copy buttons, and LaTeX mathematical equation rendering via KaTeX.
* **🌓 Thoughtful Design System** — Built with Framer Motion spring physics, tailored glassmorphism, responsive mobile drawer, and zero-flash light/dark theme switching.

---

## 📂 Project Structure

```
├── app/                        # Next.js 14 App Router
│   ├── page.tsx                # High-performance landing page
│   ├── layout.tsx              # Root layout, theme provider, brand metadata
│   ├── chat/page.tsx           # Full-screen conversational AI workspace
│   ├── api/chat/route.ts       # SSE streaming chat endpoint with failover
│   ├── api/chats/route.ts      # Conversation list & full-text search
│   ├── api/chats/[id]/route.ts # Thread loading, renaming, and deletion
│   └── api/user/route.ts       # Frictionless session onboarding
│
├── components/                 # Reusable UI Components
│   ├── ChatApp.tsx             # Workspace state, streaming controller & layout
│   ├── Composer.tsx            # Auto-expanding input, image upload & voice dictation
│   ├── MessageBubble.tsx       # Message rendering, markdown formatting & avatars
│   ├── Markdown.tsx            # Syntax highlighting & interactive code sandbox
│   ├── Sidebar.tsx             # Thread history, search & pinned chats
│   ├── NameModal.tsx           # Session onboarding modal
│   └── landing/                # Interactive landing page sections & animated charts
│
├── lib/                        # Core Engine & Architecture
│   ├── modelRouter.ts          # Autonomous multi-tier reasoning router & streaming
│   ├── db.ts                   # Prisma database client with serverless resilience
│   ├── session.ts              # Cryptographically signed httpOnly session management
│   ├── rateLimit.ts            # Sliding-window user rate limiting
│   └── types.ts                # Application-wide TypeScript definitions
│
├── prisma/                     # Database Layer
│   ├── schema.prisma           # Data schema (User, Chat, Message)
│   └── dev.db                  # Local development SQLite database
│
└── public/                     # Static Assets & Icons
    ├── images/                 # Brand emblems, logos, and previews
    ├── favicon.ico             # Multi-resolution favicon (16px, 32px, 48px)
    ├── icon-48.png             # Search standard icon
    ├── icon-192.png            # Mobile web app icon
    └── icon-512.png            # High-resolution application icon
```

---

## 🛠️ Quick Start

### Prerequisites
* **Node.js** 18.17+ or higher
* **npm** or **pnpm**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TejaPriyan/TejapriyanAI.git
   cd TejapriyanAI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example configuration:
   ```bash
   cp .env.example .env
   ```
   Add your keys and configuration to `.env`.

4. **Initialize Database & Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Configuration

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Database connection string (defaults to `file:./dev.db`) | Yes |
| `AUTH_SECRET` | 32-byte secret key used to sign secure session cookies | Yes |
| `GROQ_API_KEY` | High-speed cloud reasoning pipeline | Optional |
| `OPENROUTER_API_KEY` | Multi-model cloud gateway key | Optional |
| `NVIDIA_API_KEY` | High-capacity reasoning engine | Optional |
| `BYTEZ_API_KEY` | High-availability inference network | Optional |
| `NEXT_PUBLIC_SITE_URL` | Deployed domain URL (e.g., `https://tejapriyan-ai.vercel.app`) | Optional |

---

## 🚢 Production Deployment

Build the optimized production bundle:

```bash
npm run build
npm start
```

Deployable with one click on **Vercel**, **AWS**, or any Node.js hosting platform.

---

## 👨‍💻 Author

**Teja Priyan**  
* GitHub: [@TejaPriyan](https://github.com/TejaPriyan)  
* Platform: [https://tejapriyan-ai.vercel.app](https://tejapriyan-ai.vercel.app)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
