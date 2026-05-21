import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Brand
        brand: {
          DEFAULT: "#F4655E",
          soft: "#FDE7E4",
          deep: "#C73D36",
        },
        // Bucket palette. Updated 2026-05-20:
        //   Spend = green (go-money, the daily allowance)
        //   Save  = blue  (calm, deferred, building)
        //   Share = red   (serious, charity, important)
        // Positive-money UI (incoming deposits, valid totals) reuses spend
        // green; bucket label disambiguates from the Spend bucket itself.
        spend: {
          DEFAULT: "#10B981", // emerald-500
          soft: "#DCFCE7",    // green-100
        },
        save: {
          DEFAULT: "#2563EB", // unchanged
          soft: "#E4ECFF",
        },
        share: {
          DEFAULT: "#DC2626", // red-600 — distinct from brand rose
          soft: "#FEE2E2",    // red-100
        },
        // Surface neutrals (warm, not cool gray)
        ink: {
          DEFAULT: "#2D2A2E",
          muted: "#76717A",
        },
        line: {
          DEFAULT: "#EBE4DC",
          soft: "#F3EDE5",
        },
        // shadcn semantic tokens (CSS variable driven)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Outfit"', "system-ui", "sans-serif"],
        data: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
