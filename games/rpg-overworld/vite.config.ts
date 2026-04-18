import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, "dev.html"),
    },
  },
  server: {
    host: "0.0.0.0",
  },
});
