import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "_next/**",
      "404/**",
      "_not-found/**",
      "node_modules/**",
      "*.html",
      "*.txt"
    ]
  }
];

export default eslintConfig;
