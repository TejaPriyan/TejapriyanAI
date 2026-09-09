"use client";
/**
 * Shared landing-page building blocks: scroll-reveal wrappers, animated
 * counters, section framing and a magnetic CTA button.
 */
import { useEffect, useRef, useState } from "react";
import {
  motion, useInView, useMotionValue, useSpring, useTransform,
  useScroll, type MotionValue,
} from "framer-motion";

/* ---------- easing shared across the site ---------- */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Fades + lifts children into view gracefully, never hiding content if JavaScript or inView is delayed. */
export function Reveal({
  children, delay = 0, y = 16, className = "",
}: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={mounted && inView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
      style={{ opacity: 1 }}
    >
      {children}
    </motion.div>
  );
}

/** Staggers each child in sequence as the group enters view. */
export function RevealGroup({
  children, className = "", stagger = 0.08,
}: { children: React.ReactNode; className?: string; stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={false}
      animate="show"
      variants={{ show: { transition: { staggerChildren: stagger } } }}
      className={className}
      style={{ opacity: 1 }}
    >
      {children}
    </motion.div>
  );
}

export const RevealItem = ({
  children, className = "",
}: { children: React.ReactNode; className?: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 1, y: 0 },
      show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
    }}
    className={className}
    style={{ opacity: 1 }}
  >
    {children}
  </motion.div>
);

/** Words rise into place one at a time — used for the hero headline. */
export function AnimatedWords({
  text, className = "", delay = 0,
}: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.85, delay: delay + i * 0.055, ease: EASE }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Counts up to `value` when scrolled into view. */
export function Counter({
  value, decimals = 0, suffix = "", prefix = "",
}: { value: number; decimals?: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  // No negative margin here: stats sitting above the fold must still count up
  // on load, otherwise they'd sit frozen at zero until the user scrolls past.
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18, mass: 1 });
  const [display, setDisplay] = useState("0");

  useEffect(() => { if (inView) mv.set(value); }, [inView, value, mv]);
  useEffect(
    () => spring.on("change", (v) => setDisplay(v.toFixed(decimals))),
    [spring, decimals]
  );

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

/** Small uppercase section label. */
export const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4 flex items-center gap-2.5">
    <span className="h-px w-6 bg-clay-400" />
    <span className="label text-clay-600 dark:text-clay-400">
      {children}
    </span>
  </div>
);

/** Consistent section wrapper with generous editorial spacing. */
export const Section = ({
  children, className = "", id,
}: { children: React.ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`px-6 py-24 sm:py-32 lg:px-8 ${className}`}>
    <div className="mx-auto max-w-6xl">{children}</div>
  </section>
);

/** Button that leans slightly toward the cursor. */
export function MagneticButton({
  children, onClick, variant = "primary", className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18 });
  const sy = useSpring(y, { stiffness: 260, damping: 18 });

  const move = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set(((e.clientX - r.left) / r.width - 0.5) * 12);
    y.set(((e.clientY - r.top) / r.height - 0.5) * 8);
  };
  const reset = () => { x.set(0); y.set(0); };

  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-medium transition-colors";
  const styles =
    variant === "primary"
      ? "bg-ink text-sand-50 hover:bg-ink-soft dark:bg-sand-100 dark:text-ink dark:hover:bg-white"
      : "border border-sand-300 text-ink hover:bg-sand-100 dark:border-sand-700 dark:text-sand-100 dark:hover:bg-sand-900";

  return (
    <motion.button
      ref={ref}
      onMouseMove={move}
      onMouseLeave={reset}
      onClick={onClick}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.97 }}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </motion.button>
  );
}

/** Parallax helper — shifts content as the page scrolls. */
export function useParallax(distance = 60): [React.RefObject<HTMLDivElement>, MotionValue<number>] {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const yv = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return [ref, yv];
}
