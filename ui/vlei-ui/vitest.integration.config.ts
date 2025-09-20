import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'integration',
    include: ['**/*.integration.test.ts'],
    timeout: 90000, // 90 seconds for integration tests
    hookTimeout: 15000,
    testTimeout: 90000,
    environment: 'node',
    setupFiles: ['./tests/setup.integration.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});