import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        brand: {
          purple: "#833AB4",
          pink: "#E1306C",
          orange: "#F77737",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        reel: "14px",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #833AB4 0%, #E1306C 55%, #F77737 100%)",
      },
      keyframes: {
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        scan: {
          "0%": { transform: "translateY(-10%)" },
          "100%": { transform: "translateY(1000%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shine: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(250%)" },
        },
        breathe: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
        playhead: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0%)" },
        },
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "reel-progress": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "dot-bounce": {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "40%": { transform: "translateY(-3px)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 6s linear infinite",
        scan: "scan 2.4s ease-in-out infinite",
        marquee: "marquee 8s linear infinite",
        shine: "shine 2.2s ease-in-out infinite",
        breathe: "breathe 3s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
        wave: "wave 1.1s ease-in-out infinite",
        playhead: "playhead 3s linear infinite",
        blink: "blink 1s step-end infinite",
        "reel-progress": "reel-progress 6s linear infinite",
        "dot-bounce": "dot-bounce 1.2s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
