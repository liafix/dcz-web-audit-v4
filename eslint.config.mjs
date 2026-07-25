import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const compat = new FlatCompat({ baseDirectory: dirname });

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'drizzle/**', 'public/**'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];
