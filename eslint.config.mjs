import expoConfig from "eslint-config-expo/flat.js";
import prettierConfig from "eslint-config-prettier";

export default [
  ...expoConfig,
  prettierConfig,
  {
    ignores: ["node_modules/**", ".expo/**", "dist/**", "web-build/**"],
  },
  {
    rules: {
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
