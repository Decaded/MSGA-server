import js from '@eslint/js';
import nodePlugin from 'eslint-plugin-node';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script'
    },
    plugins: {
      node: nodePlugin
    },
    rules: {
      indent: ['error', 2, { SwitchCase: 1 }],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],

      curly: ['error', 'multi-line', 'consistent'],

      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      eqeqeq: ['error', 'always'],

      'node/no-unpublished-require': 'off',
      'node/no-missing-require': 'off',
      'node/no-extraneous-require': 'error',
      'node/no-unsupported-features/es-syntax': [
        'error',
        { ignores: ['modules'] }
      ],

      'no-throw-literal': 'error',
      'no-return-await': 'error'
    },
    ignores: ['node_modules/', 'logs/', '**/*.log', 'eslint.config.js']
  }
];
