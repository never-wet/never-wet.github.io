import { execSync } from "node:child_process";

const gateScript = process.argv[2] ?? "release:must-have";
const passes = Number.parseInt(process.argv[3] ?? "5", 10);

if (!Number.isFinite(passes) || passes < 1) {
  throw new Error(`Invalid pass count "${process.argv[3] ?? ""}"`);
}

function run(command) {
  console.log(`\n[release] ${command}`);
  execSync(command, { stdio: "inherit" });
}

for (let pass = 1; pass <= passes; pass += 1) {
  console.log(`\n[release] pass ${pass}/${passes}`);
  run("npm.cmd run qa");
  run(`npm.cmd run ${gateScript}`);
  run("npm.cmd run build");
}

console.log(`\n[release] completed ${passes} pass(es) using ${gateScript}`);
