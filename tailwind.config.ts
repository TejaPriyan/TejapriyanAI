import type { Config } from "tailwindcss";

/**
 * Design tokens — an elevated, modern editorial palette:
 * clean obsidian dark mode, crisp high-contrast light mode, and vibrant warm sunset accents.
 */
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // High-clarity editorial neutrals (replaces muddy olive/yellow undertones)
        sand: {
          50: "#fafafc",
          100: "#f3f3f6",
          200: "#e5e5eb",
          300: "#d3d3dd",
          400: "#a0a0b0",
          500: "#707082",
          600: "#4e4e5e",
          700: "#363644",
          800: "#22222d",
          900: "#16161f",
          950: "#0c0c12",
        },
        // Radiant sunset accent (clean, vibrant, warm)
        clay: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
        ink: {
          DEFAULT: "#0f0f14",
          soft: "#272733",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "ui-serif", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: { tightest: "-0.045em", tighter: "-0.03em" },
      borderRadius: { "4xl": "2rem" },
      boxShadow: {
        subtle: "0 1px 3px rgba(15,15,20,0.05), 0 1px 2px rgba(15,15,20,0.03)",
        card: "0 4px 6px -1px rgba(15,15,20,0.05), 0 10px 30px -5px rgba(15,15,20,0.08)",
        lift: "0 10px 25px -5px rgba(15,15,20,0.1), 0 20px 48px -10px rgba(15,15,20,0.15)",
        glow: "0 0 25px -5px rgba(249,115,22,0.25)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "grain": {
          "0%,100%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(-2%,-2%)" },
        },
      },
      animation: {
        "fade-up": "fade-up .7s cubic-bezier(.22,1,.36,1) both",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
