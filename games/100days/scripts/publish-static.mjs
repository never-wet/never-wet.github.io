import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist");
const outputAssets = path.join(projectRoot, "assets");

const removeIfExists = async (targetPath) => {
  await fs.rm(targetPath, { recursive: true, force: true });
};

await removeIfExists(outputAssets);
await fs.mkdir(outputAssets, { recursive: true });

await fs.copyFile(path.join(distRoot, "dev.html"), path.join(projectRoot, "index.html"));
await fs.cp(path.join(distRoot, "assets"), outputAssets, { recursive: true });
