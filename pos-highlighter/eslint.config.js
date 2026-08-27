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
      globals: {
        ...globals.browser,
        // Lo inyecta Vite con `define` (el hash del commit, para el pie de
        // página). No existe en el fuente y el navegador nunca lo ve como
        // global: en el build ya viene sustituido por su literal.
        __APP_BUILD__: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    /* Los `.generated` salen de design-tokens y del hub, y nadie los edita a
       mano: la regla de fast refresh —que pide no mezclar componentes con
       constantes en un archivo— es sobre la ERGONOMÍA de editarlo. Aquí el
       archivo se reescribe entero con `npm run sync`, así que lo que protege no
       existe. El resto de reglas SÍ se les aplica, y por eso el catch sin usar
       y la variable muerta del motor de progreso se arreglaron en su fuente
       (Grammar HUB/gamification-engine.js) en vez de silenciarse aquí. */
    files: ['**/*.generated.{js,jsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
