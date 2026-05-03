import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "_next/**",
      "out/**",
      "404/**",
      "_not-found/**",
      "node_modules/**",
      "*.html",
      "*.txt"
    ]
  },
  ...nextVitals,
  ...nextTypescript
];

export default eslintConfig;
