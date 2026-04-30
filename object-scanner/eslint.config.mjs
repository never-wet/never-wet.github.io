import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "_next/**",
      "_not-found/**",
      "404/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "404.html",
      "index.html",
      "index.txt",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
