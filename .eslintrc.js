module.exports = {
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'warn',
  },
  env: {
    node: true,
    es6: true,
    es2020: true,
    jest: true,
  },
  globals: {
    BigInt: 'readonly'
  }
};
