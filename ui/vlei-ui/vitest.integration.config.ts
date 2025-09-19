import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'integration',
    include: ['**/*.integration.test.ts'],
    timeout: 30000, // 30 seconds for integration tests
    hookTimeout: 10000,
    testTimeout: 30000,
    environment: 'node',
    setupFiles: ['./tests/setup.integration.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});