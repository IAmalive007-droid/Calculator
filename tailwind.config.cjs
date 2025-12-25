/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-page": "#eee9df",
        "bg-card": "#fffcf7",
        "btn-number": "#dcd7ff",
        "btn-action": "#a4f2ef",
        "btn-operator": "#ffd9cc",
        "text-primary": "#260349",
        "display-bg": "#e5ece9"
      },
      boxShadow: {
        soft: "0 16px 60px rgba(0, 0, 0, 0.08)",
        btn: "0 8px 16px rgba(0, 0, 0, 0.06)"
      },
      borderRadius: {
        xl2: "28px"
      },
      transitionTimingFunction: {
        "springy": "cubic-bezier(0.34, 1.56, 0.64, 1)"
      }
    },
  },
  plugins: [],
};

