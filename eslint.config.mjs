import js from '@eslint/js';
import globals from 'globals';
import mochaPlugin from 'eslint-plugin-mocha';
import pluginVue from 'eslint-plugin-vue';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['public/', 'logs/', 'pids/', 'node_modules/'],
  },
  js.configs.recommended,
  {
    // Backend: CommonJS on Node.js
    files: [
      '*.js',
      'api/**/*.js',
      'benchmark/**/*.js',
      'modules/**/*.js',
      'sockets/**/*.js',
      'utils/**/*.js',
      'test/**/*.js',
    ],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Unused callback arguments document the interface in this callback-heavy code base
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },
  // Frontend: Vue 3 single-file components and ES modules built with Vite
  ...pluginVue.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['src/**/*.js', 'src/**/*.vue'],
  })),
  {
    files: ['src/**/*.js', 'src/**/*.vue'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    // Mocha suites: the API tests (CommonJS) and the frontend unit tests
    // (ES modules); both run in Node with Mocha's BDD globals
    files: ['test/**/*.js', 'test/**/*.mjs'],
    ...mochaPlugin.configs.recommended,
    languageOptions: {
      ...mochaPlugin.configs.recommended.languageOptions,
      globals: {
        ...globals.node,
        ...mochaPlugin.configs.recommended.languageOptions?.globals,
      },
    },
    rules: {
      ...mochaPlugin.configs.recommended.rules,
      // Deliberate skips document node behavior that the explorer does not rely on
      'mocha/no-skipped-tests': 'off',
      'mocha/no-pending-tests': 'off',
    },
  },
  prettierConfig,
];
