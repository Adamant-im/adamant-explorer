module.exports = {
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'google',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'require-jsdoc': ['off'],
  },
};
