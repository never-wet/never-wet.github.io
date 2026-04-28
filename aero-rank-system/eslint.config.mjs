import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      "public/**",
      "out/**",
      ".next/**",
      "_next/**",
      "_not-found/**",
      "404/**",
      "draco/**",
      "models/**",
      "node_modules/**"
    ]
  },
  ...nextVitals
];

export default eslintConfig;
