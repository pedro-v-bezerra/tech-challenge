// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/*.config.{js,cjs,mjs}',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // `any` é sinal de tipo ainda não entendido (PRACTICES.md).
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  eslintConfigPrettier,
);
