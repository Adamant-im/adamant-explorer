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
    'new-cap': ['off'],
    'camelcase': ['off'],
    'max-len': ['error', {
      'code': 200,
    }],
  },
};
