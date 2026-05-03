import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "_next/**",
    "out/**",
    "build/**",
    "404/**",
    "_not-found/**",
    "404.html",
    "index.html",
    "index.txt",
    "__next.*.txt",
    "next-env.d.ts",
    "node_modules/**"
  ])
]);

export default eslintConfig;
