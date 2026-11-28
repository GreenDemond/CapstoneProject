// Code checks (DECISIONS.md T10): ESLint with its recommended rules.
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/", "web-app/", "playwright-report/", "test-results/", "site/"] },
  js.configs.recommended,
  {
    files: ["js/**/*.js"],
    languageOptions: { globals: globals.browser, sourceType: "module" },
  },
  {
    files: ["**/*.mjs", "**/*.js", "tests/**/*.js", "playwright.config.js"],
    ignores: ["js/**/*.js"],
    languageOptions: { globals: globals.node, sourceType: "module" },
  },
];
