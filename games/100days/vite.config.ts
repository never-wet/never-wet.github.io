import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
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
