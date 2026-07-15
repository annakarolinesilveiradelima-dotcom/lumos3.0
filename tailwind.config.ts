import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080706",
        night: "#0d0c0a",
        gold: "#d4af37",
        ember: "#a16207",
        parchment: "#f7eedb",
        ash: "#a8a29e",
        danger: "#ef4444"
      },
      boxShadow: {
        glow: "0 0 45px rgba(212,175,55,.22)",
        panel: "0 28px 90px rgba(0,0,0,.38)"
      }
    }
  },
  plugins: []
};
export default config;
