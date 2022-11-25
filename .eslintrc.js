module.exports = {
  env: {
    browser: true,
    node: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 12,
  },
  extends: ['eslint:recommended', 'plugin:mocha/recommended'],
  plugins: ['mocha'],
  rules: {
    'require-jsdoc': ['off'],
    'new-cap': ['off'],
    camelcase: ['off'],
    'max-len': [
      'error',
      {
        code: 300,
      },
    ],
    'comma-dangle': ['error', 'always-multiline'],
    'no-unused-vars': ['off'],
    'semi': ['error', 'always'],
  },
};
