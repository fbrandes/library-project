import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import react from "@eslint-react/eslint-plugin";
import svelte from "eslint-plugin-svelte";
import { defineConfig } from "eslint/config";

export default defineConfig([

  // ------------------------------------------------------------------
  // JavaScript / TypeScript
  // ------------------------------------------------------------------

  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.browser,
    },
  },

  ...tseslint.configs.recommended,

  // ------------------------------------------------------------------
  // Astro
  // ------------------------------------------------------------------

  ...astro.configs.recommended,

  {
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // ------------------------------------------------------------------
  // Vue
  // ------------------------------------------------------------------

  ...vue.configs["flat/recommended"],

  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // ------------------------------------------------------------------
  // React
  // ------------------------------------------------------------------

  ...react.configs.recommended,

  {
    files: ["**/*.{jsx,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
    },
  },

  // ------------------------------------------------------------------
  // Svelte
  // ------------------------------------------------------------------

  ...svelte.configs.recommended,

  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
]);
