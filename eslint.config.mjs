import js from "@eslint/js"
import prettier from "eslint-config-prettier/flat"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import storybook from "eslint-plugin-storybook"
import globals from "globals"
import tseslint from "typescript-eslint"

// Must stay .mjs — the root package.json has no "type": "module", so eslint.config.js would be
// parsed as CommonJS.
export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/storybook-static/**", "**/node_modules/**"],
  },

  js.configs.recommended,

  // The non-type-checked preset on purpose: type-aware rules require every linted file to
  // belong to a tsconfig, and this config file belongs to none. `strict` +
  // noUncheckedIndexedAccess + exactOptionalPropertyTypes in tsconfig.base.json, checked by
  // `pnpm -r typecheck`, already cover what those rules would add here.
  tseslint.configs.recommended,

  reactHooks.configs.flat.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // Guards Vite's fast-refresh contract: a module exporting both components and non-components
  // loses HMR. Stories are exempt — their default export is a meta object by design.
  {
    files: ["apps/docs/src/**/*.tsx"],
    ignores: ["**/*.stories.tsx"],
    plugins: { "react-refresh": reactRefresh },
    rules: {
      "react-refresh/only-export-components": "warn",
    },
  },

  // Build/tooling config files and repository scripts run in Node, not the browser.
  {
    files: ["**/*.config.{ts,mts,mjs}", "apps/docs/.storybook/*.ts", "scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },

  ...storybook.configs["flat/recommended"],

  // Last, so formatting-related rules that would fight Prettier are switched off.
  prettier,
)
