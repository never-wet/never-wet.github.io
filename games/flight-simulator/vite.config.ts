import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function getCesiumBaseUrl() {
  if (process.env.VITE_CESIUM_BASE_URL) {
    return process.env.VITE_CESIUM_BASE_URL;
  }

  try {
    const packagePath = path.resolve(__dirname, "node_modules/cesium/package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { version?: string };
    const version = packageJson.version ?? "1.129";

    return `https://cdn.jsdelivr.net/npm/cesium@${version}/Build/Cesium/`;
  } catch {
    return "https://cdn.jsdelivr.net/npm/cesium@1.129.0/Build/Cesium/";
  }
}

export default defineConfig({
  plugins: [react()],
  base: "./",
  define: {
    CESIUM_BASE_URL: JSON.stringify(getCesiumBaseUrl()),
  },
  build: {
    chunkSizeWarningLimit: 6000,
    rollupOptions: {
      input: path.resolve(__dirname, "dev.html"),
    },
  },
  server: {
    host: "0.0.0.0",
    fs: {
      allow: [path.resolve(__dirname, "../..")],
    },
  },
});
