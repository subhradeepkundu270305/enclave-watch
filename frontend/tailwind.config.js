/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "cyber-bg":      "#030509",
        "cyber-surface": "#080c16",
        "cyber-border":  "#16233b",
        "cyber-accent":  "#00f0ff",
        "cyber-green":   "#00ff88",
        "cyber-red":     "#ff0055",
        "cyber-amber":   "#ffb700",
        "cyber-purple":  "#a855f7",
        "cyber-text":    "#f1f5f9",
        "cyber-muted":   "#64748b",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-accent":  "0 0 25px rgba(0,240,255,0.25)",
        "glow-green":   "0 0 25px rgba(0,255,136,0.25)",
        "glow-red":     "0 0 25px rgba(255,0,85,0.25)",
        "glow-amber":   "0 0 25px rgba(255,183,0,0.25)",
        "glow-purple":  "0 0 25px rgba(168,85,247,0.25)",
        "sidebar-glow": "5px 0 30px rgba(0,240,255,0.08)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(ellipse at center, var(--tw-gradient-stops))",
        "cyber-grid": "linear-gradient(rgba(0,240,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.025) 1px, transparent 1px)",
      },
      backgroundSize: {
        "cyber-grid": "40px 40px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        scanline: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
    },
  },
  plugins: [],
};
