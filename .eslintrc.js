module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 12,
  },
  plugins: ['mocha'],
  extends: ['eslint:recommended', 'plugin:mocha/recommended'],
  rules: {
    'require-jsdoc': ['off'],
    'new-cap': ['off'],
    'camelcase': ['off'],
    'max-len': [
      'error',
      {
        code: 300,
      },
    ],
    'comma-dangle': ['error', 'always-multiline'],
    'no-unused-vars': ['off'],
    'semi': ['error', 'always'],
    'mocha/no-skipped-tests': ['off'],
  },
};
