import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  {
    files: ["src/app/api/**/*.{ts,tsx}"],
    languageOptions: {
      // Treat API routes as server-only environment
      globals: {
        window: "off",
        document: "off",
        navigator: "off"
      }
    },
    rules: {
      // Forbid browser globals in API routes
      "no-restricted-globals": ["error", "window", "document", "navigator"]
    }
  }
];

export default eslintConfig;
