/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#ccff00",
          hover: "#b8e600",
          soft: "rgba(204,255,0,0.12)",
        },
        ink: {
          950: "#05080f",
          900: "#080d17",
          850: "#0b1220",
          800: "#101a2b",
          700: "#17233a",
          600: "#1f2f4a",
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
