import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      "out/**",
      ".next/**",
      "_next/**",
      "_not-found/**",
      "404/**",
      "node_modules/**"
    ]
  },
  ...nextVitals
];

export default eslintConfig;
