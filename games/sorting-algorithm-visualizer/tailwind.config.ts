import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./store/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 22px 80px rgba(19, 28, 40, 0.12)",
        soft: "0 14px 40px rgba(19, 28, 40, 0.08)",
      },
      colors: {
        ink: "#18212f",
        paper: "#f7f5ee",
        mint: "#2fbf9f",
        coral: "#f25f5c",
        amber: "#f2b705",
        cyan: "#2a9fd6",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
