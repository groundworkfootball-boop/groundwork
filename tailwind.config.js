/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ccff00', // The neon green/yellow from screenshots
          hover: '#b3e600',
        },
        dark: {
          bg: '#0b1121', // Deep dark blue background
          surface: '#151c2c', // Lighter surface for cards and sidebar
          border: '#2a3441',
        },
        text: {
          primary: '#ffffff',
          secondary: '#9ca3af',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
