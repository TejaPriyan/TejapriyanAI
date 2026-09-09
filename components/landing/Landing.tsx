"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  motion, useScroll, useSpring, AnimatePresence,
} from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import {
  Reveal, RevealGroup, RevealItem, Counter,
  Eyebrow, Section, MagneticButton, EASE,
} from "./Primitives";
import { LatencyChart, ReliabilityChart, RoutingDonut, ThroughputChart } from "./Charts";
import { IconSpark, IconSun, IconMoon, IconMenu, IconClose } from "@/components/Icons";

/* ── content ── */
const NAV = [
  { href: "#about",        label: "About" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#performance",  label: "Performance" },
  { href: "#motivation",   label: "Why it exists" },
  { href: "#principles",   label: "Principles" },
];

const CAPABILITIES = [
  {
    title: "Answers that stream as they're formed",
    body: "Every response streams token by token with zero latency. No spinners, no waiting for a wall of text — you read along naturally as the thought develops.",
  },
  {
    title: "Four reasoning depths, one unified control",
    body: "Fast for instant answers. Think for structured reasoning. Max for deep technical analysis. Ultra when you need exhaustive breakdown — all working shown, every angle covered.",
  },
  {
    title: "Adaptive structure that fits the inquiry",
    body: "Natural conversational prose comes first. Formatted tables, numbered steps, bullet points, syntax-highlighted code, and LaTeX mathematics appear precisely when they bring clarity.",
  },
  {
    title: "Native multimodal vision understanding",
    body: "Upload or drag & drop screenshots, complex architectural diagrams, whiteboard photos, or handwritten math problems. Analysis returns in seconds in plain language.",
  },
  {
    title: "Autonomous self-healing architecture",
    body: "Intelligent multi-tier routing sits behind every query. If any route encounters congestion or latency, your conversation continues uninterrupted without dropping a token.",
  },
  {
    title: "Private session history & instant export",
    body: "Conversations are titled automatically, searchable, and stored securely in your private workspace. Pin key threads, search instantly, and export cleanly to formatted Markdown or Text.",
  },
];

const PRINCIPLES = [
  {
    n: "01",
    title: "Clarity over cleverness",
    body: "A confusing answer is an ineffective answer. Structured hierarchy, clean prose, and honest precision always triumph over confident walls of text.",
  },
  {
    n: "02",
    title: "Speed is a primary feature",
    body: "Latency is the difference between a tool you reach for instinctively and one you avoid. Every layer is engineered to put the first token on your screen in milliseconds.",
  },
  {
    n: "03",
    title: "Resilience by design",
    body: "Networks and computing endpoints fluctuate. The system anticipates latency spikes and intelligently routes queries through optimal neural pipelines before you notice.",
  },
  {
    n: "04",
    title: "Your data stays yours",
    body: "Your conversations, uploaded files, and prompt history remain strictly within your private database. Private, encrypted, and owned entirely by you.",
  },
];

const COMPARISON = [
  { f: "Instant streaming responses",       a: true, b: "Often batched" },
  { f: "Autonomous cognitive failover",     a: true, b: "Single point of failure" },
  { f: "Private local database storage",    a: true, b: "Cloud vendor locked" },
  { f: "Native image & vision analysis",    a: true, b: "Usually paid tier" },
  { f: "No passwords or subscriptions",     a: true, b: "Credit card required" },
  { f: "Conversation history & search",     a: true, b: "Varies" },
  { f: "Interactive Live Code & Game Sandbox", a: true, b: "Not available" },
  { f: "Markdown & Text thread export",     a: true, b: "Not available" },
  { f: "Ultra cognitive depth reasoning",   a: true, b: "Not available" },
];

const FAQS = [
  {
    q: "What is Teja Priyan AI?",
    a: "Teja Priyan AI is a premier multimodal AI workspace built for speed, visual reasoning, and deep analytical depth. It streams answers instantly, analyzes images and charts, renders LaTeX math equations, and formats structured tables and code snippets on demand.",
  },
  {
    q: "Do I need to pay or create an account?",
    a: "No. Teja Priyan AI is completely accessible right out of the box with zero subscription fees, no credit card required, and instant access to all reasoning depth tiers and features.",
  },
  {
    q: "What do the depth settings actually change?",
    a: "Fast provides high-speed concise answers. Think engages structured step-by-step logic. Max handles comprehensive system design and deep technical research. Ultra operates at maximum cognitive depth for exhaustive proofs, edge-case breakdowns, and complete working implementations.",
  },
  {
    q: "How are replies formatted?",
    a: "The assistant crafts natural, articulate prose by default. It incorporates comparison tables, numbered instructions, bulleted summaries, highlighted code blocks, or LaTeX math equations automatically or via the composer format chips.",
  },
  {
    q: "Where does my conversation data live?",
    a: "Your profile and conversations are stored exclusively in a private local database on your system. No conversation telemetry is harvested, and credentials never touch client-side browsers.",
  },
];

/* motivational quotes with authors */
const MOTIVATIONS = [
  {
    quote: "The best tool is the one that disappears while you use it.",
    author: "Design principle",
    sub: "behind frictionless intelligence",
  },
  {
    quote: "Intelligence amplified is not intelligence replaced.",
    author: "Core belief",
    sub: "powering deep problem solving",
  },
  {
    quote: "Ask better questions. Get further, faster.",
    author: "The promise",
    sub: "of every conversation",
  },
  {
    quote: "Resilience isn't a feature — it's the foundation.",
    author: "Engineering principle",
    sub: "behind autonomous cognitive routing",
  },
];

/* ── page ── */
export default function Landing() {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeQuote, setActiveQuote] = useState(0);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Warm the workspace in the background so the primary "Open chat" action
  // feels instant once the visitor decides to use it.
  useEffect(() => {
    const timer = window.setTimeout(() => router.prefetch("/chat"), 350);
    return () => window.clearTimeout(timer);
  }, [router]);

  // Auto-rotate motivational quotes
  useEffect(() => {
    const t = setInterval(() => setActiveQuote((q) => (q + 1) % MOTIVATIONS.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-sand-50 dark:bg-sand-950 text-sand-900 dark:text-sand-100">
      {/* reading progress */}
      <motion.div style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[60] h-[2.5px] origin-left bg-gradient-to-r from-clay-500 via-amber-500 to-rose-500 shadow-glow" />

      {/* ── nav ── */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-sand-200/80 bg-sand-50/85 backdrop-blur-xl dark:border-sand-800/80 dark:bg-sand-950/85"
          : "border-b border-transparent"}`}
      >
        <nav className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 min-w-[36px] max-w-[36px] min-h-[36px] max-h-[36px] shrink-0 items-center justify-center rounded-xl overflow-hidden border border-cyan-500/30 bg-sand-950 p-0.5 shadow-md shadow-cyan-500/20">
              <img
                src="/images/tp-logo.png"
                alt="Teja Priyan AI Logo"
                width={36}
                height={36}
                className="h-full w-full max-h-[36px] max-w-[36px] shrink-0 object-contain rounded-lg"
                style={{ width: 36, height: 36, maxWidth: 36, maxHeight: 36 }}
              />
            </span>
            <span className="font-display text-[20px] font-semibold tracking-tight text-sand-950 dark:text-white">
              Teja Priyan AI
            </span>
          </Link>

          <div className="ml-auto hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}
                className="text-sm font-medium text-sand-600 transition-colors hover:text-sand-950 dark:text-sand-300 dark:hover:text-white">
                {n.label}
              </a>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <button onClick={toggle} aria-label="Toggle theme"
              className="rounded-full p-2 text-sand-600 transition hover:bg-sand-200/70 hover:text-sand-950 dark:text-sand-300 dark:hover:bg-sand-800 dark:hover:text-white">
              {theme === "dark" ? <IconSun className="h-[18px] w-[18px]" /> : <IconMoon className="h-[18px] w-[18px]" />}
            </button>
            <Link href="/chat"
              className="hidden rounded-full bg-sand-950 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sand-850 dark:bg-white dark:text-sand-950 dark:hover:bg-sand-100 sm:inline-flex">
              Open chat
            </Link>
            <button onClick={() => setMenuOpen((v) => !v)} aria-label="Menu"
              className="rounded-full p-2 text-sand-700 md:hidden dark:text-sand-300">
              {menuOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: EASE }}
              className="overflow-hidden border-t border-sand-200 bg-sand-50 md:hidden dark:border-sand-800 dark:bg-sand-950">
              <div className="space-y-1 px-6 py-4">
                {NAV.map((n) => (
                  <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-sand-700 hover:bg-sand-100 dark:text-sand-200 dark:hover:bg-sand-900">
                    {n.label}
                  </a>
                ))}
                <Link href="/chat"
                  className="mt-2 block rounded-lg bg-sand-950 px-3 py-2.5 text-center text-sm font-medium text-white dark:bg-white dark:text-sand-950">
                  Open chat
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── hero ── */}
      <div className="relative">
        <div className="aurora grain pointer-events-none absolute inset-0" />
        <div className="dotgrid pointer-events-none absolute inset-0 text-sand-300/35 dark:text-sand-700/20"
          style={{ maskImage: "radial-gradient(70% 55% at 50% 35%, #000, transparent)",
                   WebkitMaskImage: "radial-gradient(70% 55% at 50% 35%, #000, transparent)" }} />

        <div className="relative mx-auto max-w-6xl px-6 pb-28 pt-36 sm:pt-44 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-sand-300/90 bg-white/70 px-4 py-1.5 text-xs font-medium text-sand-800 shadow-sm backdrop-blur-md dark:border-sand-700/90 dark:bg-sand-900/70 dark:text-sand-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                </span>
                ✨ Teja Priyan Neural Architecture · Adaptive Deep Reasoning · Zero Friction
              </div>

              <h1 className="display text-[clamp(2.8rem,7vw,5.5rem)] font-normal leading-[1.02] tracking-tight text-sand-950 dark:text-white">
                Intelligence,
                <br />
                <span className="italic bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400 bg-clip-text text-transparent">
                  without the friction.
                </span>
              </h1>

              <p className="measure mt-8 text-lg font-normal leading-relaxed text-sand-600 dark:text-sand-300 sm:text-xl">
                Teja Priyan AI streams thoughts in real time, understands visual attachments, generates runnable interactive code with live sandbox preview, and adapts seamlessly to your preferred reasoning depth.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3.5">
                <Link href="/chat">
                  <MagneticButton>
                    Start a conversation
                    <span aria-hidden className="text-lg leading-none">→</span>
                  </MagneticButton>
                </Link>
                <a href="#about">
                  <MagneticButton variant="ghost">Learn more</MagneticButton>
                </a>
              </div>
            </div>

            {/* Hero Visual Orb */}
            <div className="flex justify-center lg:col-span-5">
              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-8 rounded-full bg-gradient-to-tr from-purple-600/30 via-amber-500/25 to-cyan-500/30 blur-3xl pointer-events-none" />
                <motion.div
                  animate={{ y: [0, -14, 0], rotate: [0, 3, 0] }}
                  transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative h-64 w-64 sm:h-80 sm:w-80 md:h-96 md:w-96"
                >
                  <img
                    src="/images/ai-sphere.png"
                    alt="Teja Priyan AI Intelligence Core"
                    width={384}
                    height={384}
                    className="h-full w-full object-contain filter drop-shadow-[0_20px_60px_rgba(245,158,11,0.35)]"
                  />
                </motion.div>
              </div>
            </div>
          </div>

          {/* hero stats */}
          <RevealGroup className="mt-20 grid grid-cols-2 gap-x-8 gap-y-10 border-t border-sand-200/90 pt-10 sm:grid-cols-4 dark:border-sand-800/90">
            {[
              { v: <Counter value={99.9} decimals={1} suffix="%" />, l: "System Availability" },
              { v: <Counter value={4} />,                             l: "Reasoning Tiers" },
              { v: "< 0.4s",                                         l: "First-Token Latency" },
              { v: "100%",                                           l: "Private & Account-Free" },
            ].map((s, i) => (
              <RevealItem key={i}>
                <div className="display text-[2.6rem] font-semibold tabular-nums text-sand-950 sm:text-[3.1rem] dark:text-white">
                  {s.v}
                </div>
                <div className="mt-1.5 text-sm font-medium text-sand-500 dark:text-sand-400">{s.l}</div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>

      {/* ── marquee ── */}
      <div className="border-y border-sand-200/80 bg-sand-100/60 py-4.5 dark:border-sand-800/80 dark:bg-sand-900/40">
        <div className="edge-fade flex overflow-hidden">
          <div className="flex shrink-0 animate-marquee gap-14 pr-14">
            {[
              "Next-generation multimodal intelligence · Built for deep focus.",
              "Adaptive reasoning · Fast, Think, Max, and Ultra depths.",
              "Reads images, whiteboard diagrams, and complex charts.",
              "LaTeX equations, formatted tables, and production-ready code.",
              "Private local database · Your conversations remain yours.",
              "Sub-second streaming with zero interruption.",
              ...["Next-generation multimodal intelligence · Built for deep focus.", "Adaptive reasoning · Fast, Think, Max, and Ultra depths."],
            ].map((q, i) => (
              <span key={i} className="flex shrink-0 items-center gap-14 whitespace-nowrap text-sm font-medium text-sand-600 dark:text-sand-300">
                {q}
                <span className="text-clay-500">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── about ── */}
      <div className="relative overflow-hidden bg-glow-left">
        <div className="grain pointer-events-none absolute inset-0" />
        <Section id="about" className="relative">
          <div className="grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Reveal>
                <Eyebrow>About</Eyebrow>
                <h2 className="display text-[2.6rem] font-normal leading-[1.06] text-sand-950 dark:text-white sm:text-[3.4rem]">
                  Built to be the tool you actually reach for.
                </h2>
              </Reveal>
            </div>
            <div className="space-y-6 lg:col-span-7 lg:pt-14">
              <Reveal delay={0.08}>
                <p className="text-xl font-normal leading-relaxed text-sand-800 dark:text-sand-200">
                  Most AI tools make you wait behind queues, crash during traffic spikes, or demand
                  credit cards before showing value. Teja Priyan AI was designed from first principles
                  to eliminate those barriers.
                </p>
              </Reveal>
              <Reveal delay={0.14}>
                <p className="measure leading-relaxed text-sand-600 dark:text-sand-300">
                  Underneath sits a high-availability cognitive router that balances requests across
                  resilient multi-tier neural pathways. It actively monitors token latency, context windows,
                  and throughput, delivering continuous streaming with zero lag.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="measure leading-relaxed text-sand-600 dark:text-sand-300">
                  The result is an intelligent assistant that starts instantly, stays composed under load,
                  and feels like a bespoke instrument crafted for deep productivity.
                </p>
              </Reveal>

              {/* Crystal Prism Visual */}
              <Reveal delay={0.24}>
                <div className="mt-8 overflow-hidden rounded-2xl border border-sand-200/90 dark:border-sand-800/90 shadow-xl bg-sand-950/40 backdrop-blur-md">
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                    <img
                      src="/images/crystal-star.jpg"
                      alt="Prismatic Multi-Model Synthesis"
                      className="h-full w-full object-cover object-center transform hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-sand-950/90 via-transparent to-transparent flex items-end p-5">
                      <span className="text-xs font-mono text-cyan-400 font-medium tracking-wide">
                        ✦ Prismatic Cognitive Architecture · Multi-Tier Neural Fallback
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Section>
      </div>

      {/* ── capabilities ── */}
      <div className="relative overflow-hidden border-t border-sand-200 bg-panel dark:border-sand-800">
        <div className="bg-rules pointer-events-none absolute inset-0" />
        <Section id="capabilities" className="relative">
          <Reveal>
            <Eyebrow>Capabilities</Eyebrow>
            <h2 className="display max-w-2xl text-[2.6rem] font-normal leading-[1.06] text-sand-950 dark:text-white sm:text-[3.4rem]">
              Everything you'd expect. A few things you wouldn't.
            </h2>
          </Reveal>
          <RevealGroup className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c, i) => (
              <RevealItem key={c.title}>
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3, ease: EASE }} className="group">
                  <div className="mb-4 font-mono text-xs font-semibold text-clay-500">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="text-lg font-semibold leading-snug tracking-tight text-sand-900 dark:text-sand-100">{c.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-sand-600 dark:text-sand-300">{c.body}</p>
                  <div className="mt-5 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-clay-500 to-amber-500 transition-transform duration-500 group-hover:scale-x-100" />
                </motion.div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>
      </div>

      {/* ── performance / charts ── */}
      <div className="relative overflow-hidden border-t border-sand-200 bg-glow-right dark:border-sand-800">
        <div className="bg-wash pointer-events-none absolute inset-0" />
        <Section id="performance" className="relative">
          <Reveal>
            <Eyebrow>Performance</Eyebrow>
            <h2 className="display max-w-2xl text-[2.6rem] font-normal leading-[1.06] text-sand-950 dark:text-white sm:text-[3.4rem]">
              The metrics behind the experience.
            </h2>
            <p className="measure mt-5 text-sand-600 dark:text-sand-300 font-normal">
              High throughput isn't an afterthought — it is engineered into every layer, from sub-second
              first-token latency to sustained 140+ token/s output.
            </p>
          </Reveal>

          {/* Futuristic Technology Infrastructure Banner */}
          <Reveal className="mt-12 overflow-hidden rounded-3xl border border-sand-200/90 dark:border-sand-800/90 shadow-2xl relative">
            <div className="relative h-56 sm:h-72 w-full overflow-hidden">
              <img
                src="/images/tech-future.jpg"
                alt="Future of Technology Infrastructure"
                className="h-full w-full object-cover object-center transform hover:scale-105 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sand-950 via-sand-950/50 to-transparent flex items-end p-6 sm:p-8">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-1.5">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    Neural Mesh Pipeline
                  </span>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white">
                    Autonomous Multi-Tier Neural Intelligence Engine
                  </h3>
                  <p className="mt-1 text-sm text-sand-300 max-w-xl">
                    Dynamic cognitive routing with instantaneous zero-downtime failover across high-throughput reasoning and architecture layers.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="mt-16 grid gap-6 lg:grid-cols-12">
            {/* reliability */}
            <Reveal className="lg:col-span-7" delay={0.05}>
              <div className="h-full rounded-2xl border border-sand-200/90 bg-white/80 p-8 shadow-subtle backdrop-blur-md dark:border-sand-800/90 dark:bg-sand-900/60">
                <h3 className="text-sm font-semibold text-sand-900 dark:text-sand-100">Availability by cognitive routing tier</h3>
                <p className="mt-1 text-xs text-sand-500 dark:text-sand-400">Compounded probability of continuous query completion</p>
                <div className="mt-8"><ReliabilityChart /></div>
              </div>
            </Reveal>

            {/* latency */}
            <Reveal className="lg:col-span-5" delay={0.12}>
              <div className="h-full rounded-2xl border border-sand-200/90 bg-white/80 p-8 shadow-subtle backdrop-blur-md dark:border-sand-800/90 dark:bg-sand-900/60">
                <h3 className="text-sm font-semibold text-sand-900 dark:text-sand-100">Time to first token</h3>
                <p className="mt-1 text-xs text-sand-500 dark:text-sand-400">Average response latency before words stream on screen</p>
                <div className="mt-8">
                  <LatencyChart data={[
                    { label: "Fast",  value: 0.4, caption: "~0.4s" },
                    { label: "Think", value: 1.1, caption: "~1.1s" },
                    { label: "Max",   value: 2.3, caption: "~2.3s" },
                    { label: "Ultra", value: 3.8, caption: "~3.8s" },
                  ]} />
                </div>
              </div>
            </Reveal>

            {/* throughput */}
            <Reveal className="lg:col-span-5" delay={0.08}>
              <div className="h-full rounded-2xl border border-sand-200/90 bg-white/80 p-8 shadow-subtle backdrop-blur-md dark:border-sand-800/90 dark:bg-sand-900/60">
                <h3 className="text-sm font-semibold text-sand-900 dark:text-sand-100">Token throughput by depth</h3>
                <p className="mt-1 text-xs text-sand-500 dark:text-sand-400">Approximate tokens per second once streaming starts</p>
                <div className="mt-8"><ThroughputChart /></div>
              </div>
            </Reveal>

            {/* donut */}
            <Reveal className="lg:col-span-7" delay={0.05}>
              <div className="h-full rounded-2xl border border-sand-200/90 bg-white/80 p-8 shadow-subtle backdrop-blur-md dark:border-sand-800/90 dark:bg-sand-900/60">
                <h3 className="text-sm font-semibold text-sand-900 dark:text-sand-100">Cognitive pipeline workload allocation</h3>
                <p className="mt-1 text-xs text-sand-500 dark:text-sand-400">Dynamic workload distribution across reasoning and vision engines</p>
                <div className="mt-8"><RoutingDonut /></div>
              </div>
            </Reveal>

            {/* comparison table */}
            <Reveal className="lg:col-span-12" delay={0.1}>
              <div className="overflow-hidden rounded-2xl border border-sand-200/90 bg-white/80 shadow-subtle backdrop-blur-md dark:border-sand-800/90 dark:bg-sand-900/60">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-sand-200/80 dark:border-sand-800/80">
                        <th className="px-6 py-4 font-semibold text-sand-900 dark:text-sand-100">Capability</th>
                        <th className="px-6 py-4 font-semibold text-clay-600 dark:text-clay-400">Teja Priyan AI</th>
                        <th className="px-6 py-4 font-normal text-sand-500 dark:text-sand-400">Typical setup</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPARISON.map((r, i) => (
                        <motion.tr key={r.f}
                          initial={false}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.35, delay: i * 0.03 }}
                          className="border-b border-sand-100/70 last:border-0 dark:border-sand-800/60">
                          <td className="px-6 py-3.5 font-medium text-sand-800 dark:text-sand-200">{r.f}</td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center gap-2 font-semibold text-clay-600 dark:text-clay-400">
                              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 10.5l4 4 8-9" />
                              </svg>
                              Yes
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-sand-500 dark:text-sand-400">{r.b}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
          </div>
        </Section>
      </div>

      {/* ── motivational section ── */}
      <div className="relative overflow-hidden border-t border-sand-200 dark:border-sand-800" id="motivation">
        <div className="aurora pointer-events-none absolute inset-0" />
        <div className="bg-hatch pointer-events-none absolute inset-0 opacity-40" />
        <div className="grain pointer-events-none absolute inset-0" />

        <Section className="relative">
          <Reveal>
            <Eyebrow>Why it exists</Eyebrow>
            <h2 className="display max-w-2xl text-[2.6rem] font-normal leading-[1.06] text-sand-950 dark:text-white sm:text-[3.4rem]">
              Conviction, not just code.
            </h2>
          </Reveal>

          {/* auto-rotating quote carousel */}
          <div className="mt-16 grid gap-6 lg:grid-cols-2">
            <Reveal delay={0.06}>
              <div className="relative overflow-hidden rounded-2xl border border-sand-200/90 bg-white/80 p-10 shadow-subtle backdrop-blur-md dark:border-sand-700/80 dark:bg-sand-900/70">
                <div className="absolute right-6 top-6 font-display text-[6rem] leading-none text-clay-200/50 dark:text-clay-950/80 select-none">"</div>
                <div className="relative min-h-[120px]">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeQuote}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.5, ease: EASE }}>
                      <blockquote className="display text-[1.55rem] font-normal leading-[1.3] text-sand-900 dark:text-white sm:text-[1.85rem]">
                        {MOTIVATIONS[activeQuote].quote}
                      </blockquote>
                      <figcaption className="mt-5 text-sm text-sand-600 dark:text-sand-400">
                        <span className="font-semibold text-clay-600 dark:text-clay-400">{MOTIVATIONS[activeQuote].author}</span>
                        {" — "}{MOTIVATIONS[activeQuote].sub}
                      </figcaption>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* dot indicators */}
                <div className="mt-8 flex gap-2">
                  {MOTIVATIONS.map((_, i) => (
                    <button key={i} onClick={() => setActiveQuote(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === activeQuote
                          ? "w-6 bg-clay-500"
                          : "w-1.5 bg-sand-300 dark:bg-sand-700 hover:bg-sand-400"}`}
                      aria-label={`Quote ${i + 1}`} />
                  ))}
                </div>
              </div>
            </Reveal>

            {/* manifesto cards */}
            <RevealGroup className="grid gap-4 sm:grid-cols-2" stagger={0.07}>
              {[
                {
                  title: "Built for creators",
                  body: "Engineered by engineers and thinkers who rely on AI daily. Designed to eliminate every micro-frustration between thought and result.",
                  icon: "⚙️",
                },
                {
                  title: "Clarity over hype",
                  body: "No confusing brand models or rate-limit friction. Every reply is judged purely by its reasoning, structure, and direct value.",
                  icon: "🎯",
                },
                {
                  title: "Total privacy by design",
                  body: "Your prompts, uploaded images, and chat threads stay strictly in your local database. Zero telemetry, zero external tracking.",
                  icon: "🔒",
                },
                {
                  title: "Unbounded flexibility",
                  body: "Run it locally or host it in the cloud. Four depths give you total freedom from quick one-liners to exhaustive research dissertations.",
                  icon: "🌐",
                },
              ].map((card) => (
                <RevealItem key={card.title}>
                  <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.25 }}
                    className="rounded-xl border border-sand-200/90 bg-white/85 p-5 backdrop-blur-md transition hover:shadow-md dark:border-sand-700 dark:bg-sand-900/70">
                    <div className="mb-3 text-2xl">{card.icon}</div>
                    <h3 className="text-sm font-semibold text-sand-900 dark:text-sand-100">{card.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-sand-600 dark:text-sand-300">{card.body}</p>
                  </motion.div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          {/* stat row & Luxury Monogram */}
          <div className="mt-12 flex flex-col md:flex-row items-center gap-8 border-t border-sand-200/80 pt-10 dark:border-sand-800/80">
            <div className="flex-shrink-0 flex items-center gap-4 p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-md">
              <img
                src="/images/tp-monogram-gold.png"
                alt="Teja Priyan Hallmark"
                className="h-14 w-14 object-contain rounded-xl shadow-lg"
              />
              <div>
                <span className="text-xs font-mono font-semibold uppercase text-amber-500">Official Platform</span>
                <div className="text-sm font-semibold text-sand-950 dark:text-white">Teja Priyan AI</div>
              </div>
            </div>

            <RevealGroup className="flex-1 grid grid-cols-2 gap-6 sm:grid-cols-3">
              {[
                { v: "Ultra",                            l: "Maximum Cognitive Depth" },
                { v: <Counter value={180} suffix="s" />, l: "Ultra timeout buffer" },
                { v: "100% Free",                        l: "No credit card needed" },
              ].map((s, i) => (
                <RevealItem key={i}>
                  <div className="font-display text-[2rem] font-semibold tabular-nums leading-tight text-sand-900 dark:text-white sm:text-[2.4rem]">{s.v}</div>
                  <div className="mt-1 text-sm font-medium text-sand-500 dark:text-sand-400">{s.l}</div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Section>
      </div>

      {/* ── principles ── */}
      <div className="relative overflow-hidden border-t border-sand-200 bg-glow-left dark:border-sand-800">
        <Section id="principles" className="relative">
          <div className="grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <Eyebrow>Principles</Eyebrow>
                <h2 className="display text-[2.6rem] font-normal leading-[1.06] text-sand-950 dark:text-white sm:text-[3.4rem]">
                  What it's built to believe.
                </h2>
              </Reveal>
            </div>
            <div className="lg:col-span-8">
              <RevealGroup className="divide-y divide-sand-200 dark:divide-sand-800">
                {PRINCIPLES.map((p) => (
                  <RevealItem key={p.n}>
                    <motion.div whileHover={{ x: 6 }} transition={{ duration: 0.35, ease: EASE }}
                      className="flex gap-8 py-8">
                      <span className="font-mono text-xs font-semibold text-clay-500">{p.n}</span>
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-sand-900 dark:text-sand-100">{p.title}</h3>
                        <p className="measure mt-2.5 leading-relaxed text-sand-600 dark:text-sand-300 font-normal">{p.body}</p>
                      </div>
                    </motion.div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </div>
        </Section>
      </div>

      {/* ── FAQ ── */}
      <div className="relative overflow-hidden border-t border-sand-200 bg-panel dark:border-sand-800">
        <div className="bg-rules pointer-events-none absolute inset-0" />
        <Section className="relative">
          <Reveal>
            <Eyebrow>Questions</Eyebrow>
            <h2 className="display max-w-2xl text-[2.6rem] font-normal leading-[1.06] text-sand-950 dark:text-white sm:text-[3.4rem]">
              Straight answers.
            </h2>
          </Reveal>
          <div className="mt-14 divide-y divide-sand-200 border-y border-sand-200 dark:divide-sand-800 dark:border-sand-800">
            {FAQS.map((f, i) => <Faq key={f.q} {...f} index={i} />)}
          </div>
        </Section>
      </div>

      {/* ── final CTA ── */}
      <div className="relative overflow-hidden border-t border-sand-200 dark:border-sand-800">
        <div className="aurora grain pointer-events-none absolute inset-0" />
        <Section className="relative">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="display text-[clamp(2.5rem,6.5vw,4.5rem)] font-normal leading-[1.04] text-sand-950 dark:text-white">
                Ask it something difficult.
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg font-normal text-sand-600 dark:text-sand-300">
                No signup, no card, no configuration. Type your name and start —
                it takes about four seconds.
              </p>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/chat">
                  <MagneticButton>
                    Open Teja Priyan AI
                    <span aria-hidden className="text-lg leading-none">→</span>
                  </MagneticButton>
                </Link>
                <span className="text-sm text-sand-500 dark:text-sand-400">
                  or press <kbd className="rounded border border-sand-300 px-1.5 py-0.5 font-mono text-xs dark:border-sand-700">⌘K</kbd> from anywhere in the chat
                </span>
              </div>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ── footer ── */}
      <footer className="border-t border-sand-200 px-6 py-12 lg:px-8 dark:border-sand-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm">
              <IconSpark className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-base font-semibold text-sand-950 dark:text-white">Teja Priyan AI</span>
          </div>
          <p className="text-xs text-sand-500 dark:text-sand-400">
            Teja Priyan AI can make mistakes. Verify important information.
          </p>
          <Link href="/chat"
            className="text-sm font-medium text-sand-600 underline-offset-4 transition hover:text-sand-950 hover:underline dark:text-sand-300 dark:hover:text-white">
            Open chat →
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* accordion row */
function Faq({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={index * 0.05}>
      <div>
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open}
          className="flex w-full items-center justify-between gap-6 py-6 text-left">
          <span className="text-lg font-semibold tracking-tight text-sand-900 dark:text-sand-100">{q}</span>
          <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.3, ease: EASE }}
            className="shrink-0 text-2xl font-light text-sand-400 dark:text-sand-500">
            +
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden">
              <p className="measure pb-7 text-[15px] leading-relaxed text-sand-600 dark:text-sand-300 font-normal">{a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}
