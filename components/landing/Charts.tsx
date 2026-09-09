"use client";
/**
 * Upgraded hand-rolled SVG charts for the landing page.
 * No charting library — every shape drawn and animated with Framer Motion.
 */
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { EASE } from "./Primitives";

/* -------------------------------------------------------------------------- */
/* Bar chart — response latency                                               */
/* -------------------------------------------------------------------------- */
type Bar = { label: string; value: number; caption: string };

export function LatencyChart({ data }: { data: Bar[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const max = Math.max(...data.map((d) => d.value));

  const COLORS = [
    "linear-gradient(90deg,#f97316,#fb923c)",
    "linear-gradient(90deg,#a855f7,#c084fc)",
    "linear-gradient(90deg,#0ea5e9,#38bdf8)",
    "linear-gradient(90deg,#64748b,#94a3b8)",
  ];

  return (
    <div ref={ref} className="space-y-5">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-4">
            <span className="text-sm font-medium text-sand-800 dark:text-sand-200">{d.label}</span>
            <span className="font-mono text-xs text-sand-500 dark:text-sand-400">{d.caption}</span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-sand-200 dark:bg-sand-800">
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: `${(d.value / max) * 100}%` } : {}}
              transition={{ duration: 1.1, delay: 0.12 * i, ease: EASE }}
              className="h-full rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Area chart — reliability vs chain depth                                   */
/* -------------------------------------------------------------------------- */
export function ReliabilityChart() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const pts = [
    { x: 0, y: 72,   label: "Base", note: "Standard Route" },
    { x: 1, y: 88,   label: "Tier 2", note: "Dual Pipeline" },
    { x: 2, y: 96,   label: "Tier 3", note: "Triple Redundancy" },
    { x: 3, y: 98.8, label: "Tier 4", note: "Cognitive Mesh" },
    { x: 4, y: 99.6, label: "Tier 5", note: "Fault Tolerant" },
    { x: 5, y: 99.9, label: "Core", note: "Teja Priyan Core" },
  ];

  const W = 520, H = 210, P = 36;
  const sx = (x: number) => P + (x / 5) * (W - P * 2);
  const sy = (y: number) => H - P - ((y - 55) / 46) * (H - P * 2);

  const line = pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x)},${sy(p.y)}`).join(" ");
  const area = `${line} L${sx(5)},${H - P} L${sx(0)},${H - P} Z`;

  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
        aria-label="Availability scales to 99.9% across cognitive tiers">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f97316" stopOpacity=".35" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0"   />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#f97316" />
            <stop offset="50%"  stopColor="#fb923c" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        {/* grid lines */}
        {[60, 75, 90, 100].map((v) => (
          <g key={v}>
            <line x1={P} x2={W - P} y1={sy(v)} y2={sy(v)}
              className="stroke-sand-200 dark:stroke-sand-800" strokeWidth="1" strokeDasharray="4 4" />
            <text x={P - 8} y={sy(v) + 4} textAnchor="end"
              className="fill-sand-400 dark:fill-sand-500" fontSize="9" fontFamily="monospace">{v}%</text>
          </g>
        ))}

        {/* area fill */}
        <motion.path d={area} fill="url(#areaFill)"
          initial={false} animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }} />

        {/* animated line */}
        <motion.path d={line} fill="none" stroke="url(#lineGrad)"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          initial={false} animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: EASE }} />

        {/* dots + hover */}
        {pts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r="10" fill="transparent" className="cursor-pointer" />
            <motion.circle cx={sx(p.x)} cy={sy(p.y)} r={hoveredIdx === i ? 6 : 4}
              className="fill-white dark:fill-sand-950" stroke="#f97316" strokeWidth="2.5"
              initial={false} animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.05, ease: EASE }} />
            {hoveredIdx === i && (
              <g>
                <rect x={sx(p.x) - 56} y={sy(p.y) - 30} width="112" height="22" rx="5"
                  className="fill-sand-900 dark:fill-sand-100" fillOpacity=".92" />
                <text x={sx(p.x)} y={sy(p.y) - 15} textAnchor="middle"
                  className="fill-white dark:fill-sand-900 font-medium" fontSize="10" fontFamily="monospace">
                  {p.note}: {p.y}%
                </text>
              </g>
            )}
            <text x={sx(p.x)} y={H - P + 16} textAnchor="middle"
              className="fill-sand-500 dark:fill-sand-400 font-medium" fontSize="9" fontFamily="monospace">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-center text-xs text-sand-500 dark:text-sand-400">
        Cognitive routing tiers → hover points for metrics
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Donut — request distribution                                               */
/* -------------------------------------------------------------------------- */
export function RoutingDonut() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const [hovered, setHovered] = useState<string | null>(null);

  const slices = [
    { label: "High-Speed Streaming Tier",   value: 45, color: "#f97316" },
    { label: "Deep Reasoning & Logic Tier", value: 30, color: "#a855f7" },
    { label: "Multimodal Vision Pipeline",  value: 18, color: "#0ea5e9" },
    { label: "Adaptive Redundancy Buffer",  value:  7, color: "#64748b" },
  ];

  const R = 62, C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div ref={ref} className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
          {slices.map((s, i) => {
            const len = (s.value / 100) * C;
            const el = (
              <motion.circle key={s.label} cx="80" cy="80" r={R} fill="none"
                stroke={s.color}
                strokeWidth={hovered === s.label ? 20 : 17}
                strokeLinecap="butt"
                strokeDasharray={`${len} ${C - len}`}
                initial={false}
                animate={{ strokeDashoffset: -offset, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.1 * i, ease: EASE }}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(s.label)}
                onMouseLeave={() => setHovered(null)}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        {/* centre label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold leading-none text-sand-900 dark:text-white">
            {hovered ? slices.find((s) => s.label === hovered)?.value + "%" : "99.9%"}
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-sand-500">
            {hovered ? "of capacity" : "Uptime"}
          </span>
        </div>
      </div>

      <ul className="w-full space-y-3">
        {slices.map((s, i) => (
          <motion.li key={s.label}
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
            className={`flex items-center gap-3 text-sm transition ${hovered === s.label ? "opacity-100 font-medium" : "opacity-85"}`}
            onMouseEnter={() => setHovered(s.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="flex-1 text-sand-700 dark:text-sand-300">{s.label}</span>
            <span className="font-mono text-xs tabular-nums text-sand-500">{s.value}%</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Token throughput sparkline                                                 */
/* -------------------------------------------------------------------------- */
export function ThroughputChart() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  // Tokens/sec for Fast / Think / Max / Ultra
  const bars = [
    { label: "Fast",  tps: 140, color: "#f97316" },
    { label: "Think", tps: 90,  color: "#a855f7" },
    { label: "Max",   tps: 55,  color: "#0ea5e9" },
    { label: "Ultra", tps: 32,  color: "#64748b" },
  ];
  const maxTps = 140;

  return (
    <div ref={ref} className="space-y-4">
      {bars.map((b, i) => (
        <div key={b.label} className="flex items-center gap-3">
          <span className="w-10 text-right text-xs font-medium text-sand-600 dark:text-sand-400">{b.label}</span>
          <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-sand-100 dark:bg-sand-800">
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: `${(b.tps / maxTps) * 100}%` } : {}}
              transition={{ duration: 1, delay: 0.1 * i, ease: EASE }}
              className="flex h-full items-center justify-end rounded-lg pr-2.5"
              style={{ background: `linear-gradient(90deg, ${b.color}aa, ${b.color})` }}
            >
              <span className="font-mono text-[10px] font-semibold text-white">{b.tps} t/s</span>
            </motion.div>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-sand-500 dark:text-sand-400">
        Approximate tokens per second — Fast prioritises instantaneous replies, Ultra maximizes depth.
      </p>
    </div>
  );
}
