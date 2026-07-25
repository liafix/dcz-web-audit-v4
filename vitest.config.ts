import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: { reporter: ['text', 'json-summary'] },
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
      'server-only': path.resolve(process.cwd(), 'src/test/server-only.ts'),
    },
  },
});
