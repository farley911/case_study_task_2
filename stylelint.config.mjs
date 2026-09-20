/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss'],

  ignoreFiles: [
    'node_modules/**',
    'dist/**',
    '.output/**',
    'coverage/**',
  ],

  rules: {
    // Keep selectors maintainable
    'selector-max-id': 0,
    'max-nesting-depth': 3,

    // Avoid specificity escalation
    'declaration-no-important': true,

    // Keep project naming predictable
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9-]*$',
      {
        message:
          'Class selectors should use kebab-case or lower camel-style names',
      },
    ],

    // SCSS naming
    'scss/dollar-variable-pattern': [
      '^[a-z][a-z0-9-]*$',
      {
        message: 'SCSS variables should use kebab-case',
      },
    ],

    'scss/at-mixin-pattern': [
      '^[a-z][a-z0-9-]*$',
      {
        message: 'SCSS mixins should use kebab-case',
      },
    ],

    'scss/at-function-pattern': [
      '^[a-z][a-z0-9-]*$',
      {
        message: 'SCSS functions should use kebab-case',
      },
    ],
  },
}