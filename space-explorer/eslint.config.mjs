import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [".next/**", "_next/**", "404/**", "_not-found/**", "node_modules/**"],
  },
  ...nextVitals,
];

export default eslintConfig;
