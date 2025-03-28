import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Get the extended configs as an array
const extendedConfigs = compat.extends("next/core-web-vitals", "next/typescript");

// Create the final config object
const eslintConfig = [
  ...extendedConfigs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];

export default eslintConfig;
