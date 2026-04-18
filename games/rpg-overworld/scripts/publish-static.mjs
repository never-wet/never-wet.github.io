import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const sourceHtml = path.join(distDir, "dev.html");
const targetHtml = path.join(root, "index.html");
const sourceAssets = path.join(distDir, "assets");
const targetAssets = path.join(root, "assets");

if (!fs.existsSync(sourceHtml)) {
  throw new Error("Expected dist/dev.html after Vite build.");
}

fs.copyFileSync(sourceHtml, targetHtml);

if (fs.existsSync(targetAssets)) {
  fs.rmSync(targetAssets, { recursive: true, force: true });
}

if (fs.existsSync(sourceAssets)) {
  fs.cpSync(sourceAssets, targetAssets, { recursive: true });
}
