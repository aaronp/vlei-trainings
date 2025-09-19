// Integration test setup
// This file sets up the test environment for integration tests that run against a real KERIA instance

import { beforeAll, afterAll } from 'vitest';

// Test configuration - adjust these to match your running KERIA instance
export const TEST_CONFIG = {
  adminUrl: process.env.KERIA_ADMIN_URL || 'http://localhost:3901',
  bootUrl: process.env.KERIA_BOOT_URL || 'http://localhost:3903',
  // Use a predictable passcode for tests
  passcode: process.env.KERIA_TEST_PASSCODE || 'test-integration-passcode-123',
  // Test timeouts
  operationTimeout: 15000,
  connectionTimeout: 10000,
};

console.log('Integration test setup initialized with config:', {
  adminUrl: TEST_CONFIG.adminUrl,
  bootUrl: TEST_CONFIG.bootUrl,
  passcode: TEST_CONFIG.passcode.substring(0, 4) + '...',
});

beforeAll(() => {
  console.log('Starting integration tests against KERIA at:', TEST_CONFIG.adminUrl);
  console.log('Make sure KERIA is running before executing these tests');
});

afterAll(() => {
  console.log('Integration tests completed');
});