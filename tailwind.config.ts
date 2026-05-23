import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Corporate blue palette
        primary: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",   // brand blue
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a5a",
        },
        navy: {
          700: "#1e3a8a",
          800: "#1e3a5a",
          900: "#0f172a",
        },
        canvas:  "#f8fafc",
        surface: "#ffffff",
      },
      fontFamily: {
        sans:    ['"Inter"', '"Segoe UI"', "-apple-system", "Roboto", "sans-serif"],
        display: ['"Plus Jakarta Sans"', '"Inter"', "sans-serif"],
      },
      boxShadow: {
        soft:   "0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.06)",
        card:   "0 4px 12px rgba(15,23,42,0.06)",
        cardLg: "0 10px 30px rgba(15,23,42,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
