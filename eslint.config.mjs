import js from '@eslint/js';
import globals from 'globals';
import mochaPlugin from 'eslint-plugin-mocha';
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
      'webpack/**/*.js',
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
  {
    // Frontend: AngularJS application bundled with webpack
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        angular: 'readonly',
        // Socket.IO client is loaded from a script tag served by the backend
        io: 'readonly',
      },
    },
    rules: {
      // Unused callback arguments document the interface in this callback-heavy code base
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },
  {
    // Mocha test suite
    files: ['test/**/*.js'],
    ...mochaPlugin.configs.recommended,
    rules: {
      ...mochaPlugin.configs.recommended.rules,
      // Deliberate skips document node behavior that the explorer does not rely on
      'mocha/no-skipped-tests': 'off',
      'mocha/no-pending-tests': 'off',
    },
  },
  prettierConfig,
];
