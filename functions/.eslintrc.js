module.exports = {
  env: {
    es2021: true, // Najnowsza wersja ECMAScript
    node: true,    // Środowisko Node.js
  },
  parserOptions: {
    ecmaVersion: 12,        // Wersja ECMAScript
    sourceType: 'module',   // Typ modułu
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
