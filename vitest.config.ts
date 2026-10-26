import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/.system_generated/**'],
    fileParallelism: false,
    alias: {
      '@rsvp/shared': path.resolve(__dirname, 'packages/shared/src'),
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
