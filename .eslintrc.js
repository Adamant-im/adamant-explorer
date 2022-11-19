module.exports = {
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'require-jsdoc': ['off'],
    'new-cap': ['off'],
    'camelcase': ['off'],
    'max-len': ['error', {
      'code': 300,
    }],
    'comma-dangle': ['error', 'always-multiline'],
    'no-unused-vars': ['off'],
  },
};
