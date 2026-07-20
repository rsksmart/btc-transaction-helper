const js = require('@eslint/js');
const globals = require('globals');
const eslintConfigPrettier = require('eslint-config-prettier/flat');
const chaiFriendly = require('eslint-plugin-chai-friendly');
const importPlugin = require('eslint-plugin-import');

const JS_FILES = ['**/*.js'];

module.exports = [
    { ignores: ['node_modules/**', 'dist/**', 'coverage/**', '.*'] },

    js.configs.recommended,

    importPlugin.flatConfigs.recommended,

    {
        plugins: {
            'chai-friendly': chaiFriendly
        },
        rules: {
            ...chaiFriendly.configs.recommendedFlat.rules
        }
    },

    eslintConfigPrettier,

    {
        files: JS_FILES,
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.es2021,
                ...globals.mocha,
                ...globals.browser
            }
        },
        rules: {
            radix: 'off',
            'no-plusplus': 'off',
            curly: 'error',
            'arrow-body-style': ['error', 'as-needed'],
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: ['**/*.test.js', 'test/**', 'samples/**', 'eslint.config.js']
                }
            ]
        }
    },

    {
        files: ['test/**/*.js'],
        languageOptions: {
            globals: {
                expect: 'readonly'
            }
        },
        rules: {
            'no-underscore-dangle': 'off'
        }
    }
];
