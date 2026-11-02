import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15202b",
        slate2: "#1f2933",
        accent: { DEFAULT: "#ff7a00", soft: "#fff1e3" },
        good: "#1f8a4c", warn: "#c9850b", crit: "#c8392b",
      },
      fontFamily: {
        display: ['"Barlow Condensed"', "Arial Narrow", "sans-serif"],
        sans: ['"Barlow"', "Helvetica Neue", "Arial", "sans-serif"],
        mono: ['"JetBrains Mono"', "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
