/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const globals = require('globals');
const pluginJs = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = [
    { ignores: ['apps/server/dist/', 'apps/web/.next', 'packages/generated-graphql/src/types.ts'] },
    { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
    { languageOptions: { globals: globals.browser } },
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
