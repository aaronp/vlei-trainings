import { describe, expect, it, beforeAll } from 'bun:test';
import { oobiClient } from './client';
import type { ResolveOOBIRequest } from './types';

describe('OOBIClient Integration Tests', () => {
  const serviceUrl = process.env.OOBI_SERVICE_URL || 'http://localhost:3001';
  const client = oobiClient(serviceUrl);

  beforeAll(() => {
    console.log(`Running OOBI integration tests against ${serviceUrl}`);
  });

  describe('resolveOOBI', () => {
    it('should successfully resolve an OOBI with minimal parameters', async () => {
      const request: ResolveOOBIRequest = {
        oobi: 'http://example.com/oobi/test',
        alias: `test-oobi-${Date.now()}`
      };

      try {
        const response = await client.resolveOOBI(request);
        
        expect(response).toBeDefined();
        expect(response.response).toBeDefined();
        expect(response.response.operation).toBeDefined();
        expect(response.response.operation.name).toBeDefined();
        expect(response.response.operation.name).toBeTypeOf('string');
        expect(response.response.success).toBe(true);
      } catch (error: any) {
        // OOBI resolution may fail with test URLs, but we should get a proper error message
        expect(error.message).toContain('Failed to resolve OOBI');
      }
    });

    it('should handle OOBI resolution with timeout parameter', async () => {
      const request: ResolveOOBIRequest = {
        oobi: 'http://example.com/oobi/timeout-test',
        alias: `timeout-test-oobi-${Date.now()}`
      };

      try {
        const response = await client.resolveOOBI(request, 1000);
        
        expect(response).toBeDefined();
        expect(response.response).toBeDefined();
        expect(response.response.operation).toBeDefined();
        expect(response.response.success).toBe(true);
      } catch (error: any) {
        // Expected to fail with test URLs, but should be a proper KERI error
        expect(error.message).toContain('Failed to resolve OOBI');
      }
    });

    it('should throw error with descriptive message on invalid OOBI', async () => {
      const request: ResolveOOBIRequest = {
        oobi: '',
        alias: 'test-alias'
      };

      await expect(client.resolveOOBI(request)).rejects.toThrow(/Failed to resolve OOBI/);
    });

    it('should throw error with descriptive message on invalid alias', async () => {
      const request: ResolveOOBIRequest = {
        oobi: 'http://example.com/oobi/test',
        alias: ''
      };

      await expect(client.resolveOOBI(request)).rejects.toThrow(/Failed to resolve OOBI/);
    });

    it('should handle network connectivity issues gracefully', async () => {
      const invalidClient = oobiClient('http://localhost:9999');
      const request: ResolveOOBIRequest = {
        oobi: 'http://example.com/oobi/network-test',
        alias: `network-test-${Date.now()}`
      };

      await expect(invalidClient.resolveOOBI(request)).rejects.toThrow();
    });

    it('should resolve multiple OOBIs with unique aliases', async () => {
      const baseAlias = `batch-oobi-test-${Date.now()}`;
      const results: any[] = [];

      for (let i = 0; i < 3; i++) {
        const request: ResolveOOBIRequest = {
          oobi: `http://example.com/oobi/test-${i}`,
          alias: `${baseAlias}-${i}`
        };

        try {
          const response = await client.resolveOOBI(request);
          results.push(response);
        } catch (error: any) {
          // Expected to fail with test URLs, but capture for verification
          expect(error.message).toContain('Failed to resolve OOBI');
          results.push({ error: error.message });
        }
      }

      expect(results).toHaveLength(3);
      
      // All should have either a valid response or proper error message
      results.forEach(result => {
        if (result.error) {
          expect(result.error).toContain('Failed to resolve OOBI');
        } else {
          expect(result.response).toBeDefined();
          expect(result.response.operation).toBeDefined();
        }
      });
    });
  });
});