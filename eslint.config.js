
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * ESLint configuration for the React and Vite frontend.
 *
 * Enables recommended JavaScript and React linting rules,
 * including React Hooks validation and Vite Fast Refresh checks.
 *
 * Applies linting to JavaScript and JSX files while excluding
 * the generated production build directory.
 */
export default defineConfig([
  // Exclude generated production files from linting.
  globalIgnores(['dist']),
  {
    // Apply the following rules to JavaScript and JSX files.
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      // Enable browser globals and JSX syntax support.
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
