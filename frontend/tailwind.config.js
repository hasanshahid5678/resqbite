/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        ink: {
          DEFAULT: "#0f1e17",
          soft: "#1f2d27",
          muted: "#5a6b62",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "sans-serif"],
        display: ["Inter", "system-ui", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: "800" }],
        "display-lg": ["3rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "800" }],
        "display-md": ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-sm": ["1.75rem", { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "700" }],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(0,0,0,0.04), 0 1px 3px -1px rgba(0,0,0,0.06)",
        "soft-md": "0 6px 16px -4px rgba(0,0,0,0.08), 0 3px 6px -3px rgba(0,0,0,0.05)",
        "soft-lg": "0 16px 40px -12px rgba(0,0,0,0.12), 0 8px 16px -8px rgba(0,0,0,0.06)",
        "soft-xl": "0 24px 60px -20px rgba(0,0,0,0.16)",
        brand: "0 10px 30px -10px rgba(5,150,105,0.4)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      backgroundImage: {
        "brand-radial":
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.18), transparent), linear-gradient(180deg, #f8fafb 0%, #ffffff 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "marquee": "marquee 28s linear infinite",
      },
    },
  },
  plugins: [],
};