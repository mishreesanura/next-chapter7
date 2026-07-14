import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}", "./e2e/**/*.{ts,tsx}", "./playwright.config.ts"],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        "border-subtle": "var(--border-subtle)",
        input: "var(--border-solid)",
        ring: "var(--primary)",
        background: "var(--background)",
        surface: "var(--surface)",
        foreground: "var(--ink)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          foreground: "var(--primary-contrast)"
        },
        secondary: {
          DEFAULT: "var(--surface)",
          foreground: "var(--ink)"
        },
        muted: {
          DEFAULT: "var(--surface)",
          foreground: "var(--secondary-ink)"
        },
        accent: {
          DEFAULT: "var(--light-green)",
          foreground: "var(--primary)"
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "var(--danger-contrast)"
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--primary-contrast)"
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--ink)"
        }
      },
      borderRadius: {
        lg: "var(--radius-card)",
        md: "var(--radius-input)",
        sm: "12px"
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        hover: "var(--shadow-hover)",
        focus: "var(--shadow-focus)",
        popover: "var(--popover-shadow)"
      },
      fontFamily: {
        sans: ["var(--font-cabinet-grotesk)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
