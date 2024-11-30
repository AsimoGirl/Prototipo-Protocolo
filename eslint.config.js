// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import unicorn from 'eslint-plugin-unicorn';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    importX.configs.typescript,
    prettier,
    {
        ignores: ['node_modules', 'dist']
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parserOptions: {
                project: 'tsconfig.json'
            }
        },
        plugins: {
            unicorn,
            'import-x': importX
        },
        rules: {
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-dynamic-delete': 'off',
            '@typescript-eslint/prefer-nullish-coalescing': 'off',
            '@typescript-eslint/no-restricted-imports': [
                'warn',
                {
                    patterns: [
                        {
                            group: ['*//', '*/.', './..', '*.d'],
                            message: 'Redundant import pattern'
                        },
                        {
                            group: ['**/../../common', '**/../../gateway'],
                            message: "Import from '@thesis'"
                        }
                    ]
                }
            ],
            '@typescript-eslint/consistent-indexed-object-style': ['warn', 'index-signature'],
            '@typescript-eslint/consistent-type-exports': 'warn',
            '@typescript-eslint/consistent-type-imports': 'warn',
            '@typescript-eslint/explicit-member-accessibility': 'warn',
            '@typescript-eslint/method-signature-style': ['warn', 'method'],
            '@typescript-eslint/prefer-regexp-exec': 'warn',
            '@typescript-eslint/no-redundant-type-constituents': 'warn',
            // REVIEW: Consider if we need certain undefined/null checks
            '@typescript-eslint/no-unnecessary-condition': 'off',
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
            '@typescript-eslint/no-unnecessary-qualifier': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

            'import-x/no-unresolved': 'off',
            'import-x/no-named-as-default-member': 'off',
            'import-x/order': [
                'warn',
                {
                    groups: [
                        'builtin',
                        'sibling',
                        'parent',
                        'index',
                        'external',
                        'internal',
                        'unknown',
                        'object',
                        'type'
                    ],
                    'newlines-between': 'always'
                }
            ],

            'unicorn/no-null': 'off',
            'unicorn/no-array-reduce': 'off',
            'unicorn/prefer-number-properties': 'off',
            'unicorn/prevent-abbreviations': 'off',
            'unicorn/prefer-math-trunc': 'off',

            'prettier/prettier': 'warn',

            //'prefer-let/prefer-let': 'error',

            'no-fallthrough': 'off',
            'prefer-const': 'off',

            'prefer-template': 'warn',
            'no-constant-binary-expression': 'warn',
            curly: ['warn', 'multi'],
            'one-var': ['warn', 'consecutive'],
            yoda: 'warn',
            'no-else-return': 'warn',
            'object-shorthand': 'warn',
            'operator-assignment': 'warn',
            'prefer-destructuring': ['warn', { object: true, array: true }],

            'array-callback-return': 'error',
            'default-case-last': 'error',
            'dot-notation': 'error',
            eqeqeq: 'error',
            'max-classes-per-file': 'error',
            'no-useless-backreference': 'error',
            'no-unsafe-optional-chaining': 'error',
            'no-unreachable-loop': 'error',
            'no-template-curly-in-string': 'error',
            'no-promise-executor-return': 'error',
            'no-prototype-builtins': 'error',
            'no-div-regex': 'error',
            'no-regex-spaces': 'error',
            'no-control-regex': 'error',
            'no-eval': 'error',
            'no-extend-native': 'error',
            'no-implied-eval': 'error',
            'no-iterator': 'error',
            'no-labels': 'error'
        }
    }
];
