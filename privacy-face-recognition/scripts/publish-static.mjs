import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const sourceHtml = path.join(distDir, "dev.html");
const sourceAssets = path.join(distDir, "assets");
const sourceModels = path.join(distDir, "models");
const targetHtml = path.join(root, "index.html");
const targetAssets = path.join(root, "assets");
const targetModels = path.join(root, "models");

if (!fs.existsSync(sourceHtml)) {
  throw new Error("Expected dist/dev.html after Vite build.");
}

fs.copyFileSync(sourceHtml, targetHtml);

for (const [source, target] of [
  [sourceAssets, targetAssets],
  [sourceModels, targetModels],
]) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }

  if (fs.existsSync(source)) {
    fs.cpSync(source, target, { recursive: true });
  }
}
