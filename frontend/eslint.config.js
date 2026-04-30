import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Warn (not error) on unused vars; allow uppercase components,
      // _prefixed args, rest siblings, and 'motion' from framer-motion
      // (ESLint doesn't recognize motion.div JSX or Icon components as usage)
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^(_|[A-Z]|motion$)',
        argsIgnorePattern: '^(_|[A-Z])',
        ignoreRestSiblings: true,
        caughtErrors: 'none',
      }],
      // Allow intentional empty catch blocks
      'no-empty': ['warn', { allowEmptyCatch: true }],
      // Standard data-fetching: useEffect(() => { fetch() }, [fetch])
      // setState inside .then() is async — not a synchronous cascade
      'react-hooks/set-state-in-effect': 'off',
      // Date.now() inside useMemo/useCallback is acceptable; the memo
      // dependency array controls when it re-runs, not every render
      'react-hooks/purity': 'off',
    },
  },
])
