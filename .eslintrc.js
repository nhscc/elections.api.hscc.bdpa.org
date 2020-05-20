const restrictedGlobals = require('confusing-browser-globals');

module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        'jsx-a11y',
        'import'
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:react/recommended'
    ],
    parserOptions: {
        ecmaVersion: 8,
        sourceType: 'module',
        ecmaFeatures: {
            impliedStrict: true,
            experimentalObjectRestSpread: true,
            jsx: true,
        }
    },
    env: {
        es6: true,
        node: true,
        jest: true,
        browser: true,
        webextensions: true,
    },
    rules: {
        'no-console': 'warn',
        'import/no-unresolved': ['error', { commonjs: true }],
        'no-unused-vars': 'off',
        'no-restricted-globals': ['warn'].concat(restrictedGlobals),
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'no-undef': 'off',
        'react/jsx-max-depth': 'error',
    },
    overrides: [{
        // enable the rule specifically for TypeScript files
        files: ['*.ts', '*.tsx'],
        rules: {
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/no-var-requires': 'error',
            'no-undef': 'error'
        }
    }],
    settings: {
        'import/extensions': [
            '.ts', '.tsx', '.js'
        ],
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
            'babel-eslint': ['.js', '.jsx'],
        },
        'import/resolver': {
            alias : {
              map: [
                ['universe','./src'],
                ['multiverse','./lib'],
              ],
              extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
            typescript: {}
        },
        'import/ignore': [
            '.*/node_modules/.*'
        ]
    }
};
