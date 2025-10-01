/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // include TS if you ever use it
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f7ff",
          100: "#dbeeff",
          200: "#b6ddff",
          400: "#4da3ff",   // mid shade
          500: "#1e88ff",   // primary
          600: "#006fe6",   // darker for hover
          700: "#0059b3",   // for focus/active
          DEFAULT: "#1e88ff" // alias → so you can just use bg-brand
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      screens: {
        xs: "480px",  // optional → tiny devices
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
    },
  },
  plugins: [],
};
