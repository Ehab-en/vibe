/**
 * tailwind.config.js — Tailwind CSS configuration
 *
 * Extends the default theme with the Vibe brand purple color
 * and sets up content paths so unused styles are tree-shaken in production.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  // "class" strategy: dark mode activates when the `dark` class is on <html>
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Vibe primary brand color
        primary: {
          DEFAULT: "#534AB7",
          50: "#EEEDF9",
          100: "#D4D2F2",
          200: "#A9A5E5",
          300: "#7E79D8",
          400: "#534AB7",
          500: "#3D3589",
          600: "#2D2764",
          700: "#1E1A42",
          800: "#0F0D21",
          900: "#000000",
        },
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
