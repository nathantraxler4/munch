/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const globals = require('globals');
const pluginJs = require('@eslint/js');
const tseslint = require('typescript-eslint');
const jsdoc = require('eslint-plugin-jsdoc');

module.exports = [
    { ignores: ['apps/server/dist/', 'apps/web/.next'] },
    { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
    { languageOptions: { globals: globals.browser } },
    {
        plugins: {
            jsdoc
        },
        rules: {
            'jsdoc/require-jsdoc': ['error', { publicOnly: true }]
        }
    },
    {
        rules: {
            'no-unused-vars': 'warn',
            'no-undef': 'warn',
            semi: ['error']
        }
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended
];
