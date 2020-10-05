module.exports = {
  env: {
    commonjs: true,
    es2020: true,
  },
  globals: {
    window: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module', // Allows for the use of imports
  },
  rules: {
    'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    'max-len': ['error', { code: 120 }],
    'import/prefer-default-export': 'off',
  },
};
