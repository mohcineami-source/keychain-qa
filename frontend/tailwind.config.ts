import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: "#8A1538",
          deep: "#5C0E26",
        },
        soft: "#F7F5F3",
        warmgray: "#E8E2DD",
        charcoal: "#171717",
        muted: "#6B625F",
        success: "#16A34A",
        border: "#E8E2DD",
        background: "#F7F5F3",
        foreground: "#171717",
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "Cairo", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs:   ["0.75rem",   { lineHeight: "1.6"  }],
        sm:   ["0.875rem",  { lineHeight: "1.7"  }],
        base: ["0.9375rem", { lineHeight: "1.9"  }],
        lg:   ["1.0625rem", { lineHeight: "1.75" }],
        xl:   ["1.1875rem", { lineHeight: "1.55" }],
        "2xl":["1.375rem",  { lineHeight: "1.4"  }],
        "3xl":["1.75rem",   { lineHeight: "1.25" }],
        "4xl":["2.125rem",  { lineHeight: "1.18" }],
        "5xl":["2.75rem",   { lineHeight: "1.12" }],
      },
      letterSpacing: {
        tighter: "-0.025em",
        tight:   "-0.012em",
        normal:  "0em",
        wide:    "0.015em",
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(23,23,23,0.06), 0 8px 24px rgba(23,23,23,0.05)",
        soft: "0 1px 2px rgba(23,23,23,0.05)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
