import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, "dev.html"),
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("gsap")) {
            return "motion";
          }

          if (
            id.includes("@react-three") ||
            id.includes("/three/") ||
            id.includes("postprocessing")
          ) {
            return "three";
          }

          if (id.includes("/react/") || id.includes("/react-dom/")) {
            return "react";
          }

          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
  },
});
