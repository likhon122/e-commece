import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium Forest Green Palette
        primary: {
          50: "#f0fdf6",
          100: "#dcfce9",
          200: "#B0E4CC",
          300: "#7dd3a8",
          400: "#408A71",
          500: "#285A48",
          600: "#1f4a3a",
          700: "#193d30",
          800: "#153228",
          900: "#091413",
          950: "#050d0b",
        },
        // Warm Cream/Neutral Palette
        secondary: {
          50: "#FDFBF7",
          100: "#F2E3BB",
          200: "#e8d5a3",
          300: "#d4be82",
          400: "#bfa562",
          500: "#9c8550",
          600: "#7a6740",
          700: "#5c4d30",
          800: "#3d3320",
          900: "#1f1910",
          950: "#0f0d08",
        },
        // Mint Accent Palette
        accent: {
          50: "#f0fdf9",
          100: "#ccfbef",
          200: "#B0E4CC",
          300: "#7dd3b4",
          400: "#4aba94",
          500: "#2d9d7a",
          600: "#217d62",
          700: "#1d6450",
          800: "#1b5042",
          900: "#194237",
          950: "#0a2520",
        },
        // Brand specific colors
        brand: {
          forest: "#285A48",
          sage: "#408A71",
          mint: "#B0E4CC",
          cream: "#F2E3BB",
          dark: "#091413",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        shimmer:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
        "gradient-premium":
          "linear-gradient(135deg, #091413 0%, #285A48 50%, #408A71 100%)",
        "gradient-light":
          "linear-gradient(135deg, #F2E3BB 0%, #B0E4CC 100%)",
      },
      boxShadow: {
        premium: "0 25px 50px -12px rgba(9, 20, 19, 0.25)",
        "premium-lg": "0 35px 60px -15px rgba(9, 20, 19, 0.3)",
        glow: "0 0 40px rgba(64, 138, 113, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
