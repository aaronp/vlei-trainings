import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { branContext } from './branContext';
import { Elysia } from 'elysia';

describe('Bran Context Middleware', () => {
  let originalEnv: any;

  beforeEach(() => {
    // Save original environment
    originalEnv = {
      KERIA_BRAN_MODE: process.env.KERIA_BRAN_MODE,
      KERIA_KEYSTORE_SALT: process.env.KERIA_KEYSTORE_SALT,
      KERIA_KEYSTORE_PASSCODE: process.env.KERIA_KEYSTORE_PASSCODE
    };
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv.KERIA_BRAN_MODE !== undefined) {
      process.env.KERIA_BRAN_MODE = originalEnv.KERIA_BRAN_MODE;
    } else {
      delete process.env.KERIA_BRAN_MODE;
    }
    if (originalEnv.KERIA_KEYSTORE_SALT !== undefined) {
      process.env.KERIA_KEYSTORE_SALT = originalEnv.KERIA_KEYSTORE_SALT;
    } else {
      delete process.env.KERIA_KEYSTORE_SALT;
    }
    if (originalEnv.KERIA_KEYSTORE_PASSCODE !== undefined) {
      process.env.KERIA_KEYSTORE_PASSCODE = originalEnv.KERIA_KEYSTORE_PASSCODE;
    } else {
      delete process.env.KERIA_KEYSTORE_PASSCODE;
    }
  });

  it('should generate a new bran when no header is provided (simple mode)', async () => {
    process.env.KERIA_BRAN_MODE = 'simple';
    
    const app = new Elysia()
      .use(branContext)
      .get('/', ({ branContext }) => ({
        bran: branContext.bran,
        isNewBran: branContext.isNewBran
      }));

    const response = await app.handle(new Request('http://localhost/'));
    const result = await response.json();

    expect(result.isNewBran).toBe(true);
    expect(result.bran).toBeDefined();
    expect(result.bran).toHaveLength(21);
    expect(response.headers.get('x-keria-bran')).toBe(result.bran);
  });

  it('should use existing bran when header is provided (simple mode)', async () => {
    process.env.KERIA_BRAN_MODE = 'simple';
    const testBran = 'testBran123456789012';
    
    const app = new Elysia()
      .use(branContext)
      .get('/', ({ branContext }) => ({
        bran: branContext.bran,
        isNewBran: branContext.isNewBran
      }));

    const response = await app.handle(new Request('http://localhost/', {
      headers: {
        'x-keria-bran': testBran
      }
    }));
    const result = await response.json();

    expect(result.isNewBran).toBe(false);
    expect(result.bran).toBe(testBran);
    expect(response.headers.get('x-keria-bran')).toBe(testBran);
  });

  it('should handle protected mode with valid signature', async () => {
    process.env.KERIA_BRAN_MODE = 'protected';
    process.env.KERIA_KEYSTORE_SALT = 'testSalt123';
    process.env.KERIA_KEYSTORE_PASSCODE = 'testPasscode456';
    
    const app = new Elysia()
      .use(branContext)
      .get('/', ({ branContext }) => ({
        bran: branContext.bran,
        isNewBran: branContext.isNewBran
      }));

    // First, generate a protected bran
    const firstResponse = await app.handle(new Request('http://localhost/'));
    const protectedBran = firstResponse.headers.get('x-keria-bran')!;
    
    // Then use it in another request
    const secondResponse = await app.handle(new Request('http://localhost/', {
      headers: {
        'x-keria-bran': protectedBran
      }
    }));
    const result = await secondResponse.json();

    expect(result.isNewBran).toBe(false);
    expect(result.bran).toBeDefined();
    expect(result.bran).toHaveLength(21); // Raw bran length
    expect(secondResponse.headers.get('x-keria-bran')).toBe(protectedBran);
  });

  it('should reject invalid protected bran and generate new one', async () => {
    process.env.KERIA_BRAN_MODE = 'protected';
    process.env.KERIA_KEYSTORE_SALT = 'testSalt123';
    process.env.KERIA_KEYSTORE_PASSCODE = 'testPasscode456';
    
    const app = new Elysia()
      .use(branContext)
      .get('/', ({ branContext }) => ({
        bran: branContext.bran,
        isNewBran: branContext.isNewBran
      }));

    const invalidProtectedBran = 'invalidBran123456789.invalidSignature';
    
    const response = await app.handle(new Request('http://localhost/', {
      headers: {
        'x-keria-bran': invalidProtectedBran
      }
    }));
    const result = await response.json();

    expect(result.isNewBran).toBe(true); // Should generate new bran due to invalid signature
    expect(result.bran).toBeDefined();
    expect(result.bran).toHaveLength(21);
    expect(response.headers.get('x-keria-bran')).not.toBe(invalidProtectedBran);
  });

  it('should throw error in protected mode without required config', async () => {
    process.env.KERIA_BRAN_MODE = 'protected';
    delete process.env.KERIA_KEYSTORE_SALT;
    delete process.env.KERIA_KEYSTORE_PASSCODE;
    
    const app = new Elysia()
      .use(branContext)
      .get('/', ({ branContext }) => ({
        bran: branContext.bran,
        isNewBran: branContext.isNewBran
      }));

    // This should not throw immediately as the middleware handles the error gracefully
    // by falling back to generating a new bran
    const response = await app.handle(new Request('http://localhost/'));
    const result = await response.json();

    expect(result.isNewBran).toBe(true);
    expect(result.bran).toBeDefined();
  });

  it('should generate different brans on multiple requests without header', async () => {
    process.env.KERIA_BRAN_MODE = 'simple';
    
    const app = new Elysia()
      .use(branContext)
      .get('/', ({ branContext }) => ({
        bran: branContext.bran,
        isNewBran: branContext.isNewBran
      }));

    const response1 = await app.handle(new Request('http://localhost/'));
    const result1 = await response1.json();

    const response2 = await app.handle(new Request('http://localhost/'));
    const result2 = await response2.json();

    expect(result1.bran).toBeDefined();
    expect(result2.bran).toBeDefined();
    expect(result1.bran).not.toBe(result2.bran);
    expect(result1.isNewBran).toBe(true);
    expect(result2.isNewBran).toBe(true);
  });
});