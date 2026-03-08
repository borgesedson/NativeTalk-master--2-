import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary": "#d1f2d3", // The light green conversation accent
        "primary-dark": "#b7e7bb",
        "primary-text": "#1a1a1a",
        "background-light": "#f8f9fa",
        "background-dark": "#1e0a2d", // The deep dark purple of the sidebar
        "surface-dark": "#1e0a2d", // Sidebar panels
        "surface-hover": "#2a1040",
        "border-dark": "rgba(0, 0, 0, 0.05)",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "xl": "1.5rem",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      "light",
      "dark",
    ],
  },
};
