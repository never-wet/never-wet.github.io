import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(projectRoot, "out");

if (!existsSync(outDir)) {
  throw new Error("Next export folder was not found.");
}

function assertInsideProject(target) {
  const resolved = resolve(target);
  if (!resolved.startsWith(`${projectRoot}\\`) && !resolved.startsWith(`${projectRoot}/`)) {
    throw new Error(`Refusing to write outside project root: ${resolved}`);
  }
  return resolved;
}

for (const entry of readdirSync(outDir, { withFileTypes: true })) {
  const source = resolve(outDir, entry.name);
  const target = assertInsideProject(resolve(projectRoot, entry.name));

  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }

  cpSync(source, target, { recursive: true });
}

rmSync(outDir, { recursive: true, force: true });

console.log("Static export published to games/sorting-algorithm-visualizer/ root.");
