/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#b6ff1a",
          hover: "#a3f000",
          deep: "#8fe000",
          soft: "rgba(182,255,26,0.12)",
        },
        ink: {
          950: "#04070c",
          900: "#070b12",
          850: "#0a101a",
          800: "#0f1725",
          700: "#16202f",
          600: "#1e2c40",
        },
        dark: {
          bg: "#05080f",
          surface: "#0b1220",
          border: "rgba(148,163,184,0.14)",
        },
        text: {
          primary: "#f8fafc",
          secondary: "#94a3b8",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        lift: "0 24px 60px -24px rgba(0,0,0,0.85)",
        brand: "0 18px 48px -18px rgba(204,255,0,0.42)",
      },
      maxWidth: {
        "8xl": "88rem",
      },
    },
  },
  plugins: [],
};
