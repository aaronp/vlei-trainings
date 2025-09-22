import { describe, expect, it, beforeAll } from 'bun:test';
import { aidClient } from './client';
import type { AID, CreateAIDRequest } from './types';

describe('AIDClient Integration Tests', () => {
  const serviceUrl = process.env.AID_SERVICE_URL || 'http://localhost:3001';
  const client = aidClient(serviceUrl);

  beforeAll(() => {
    console.log(`Running integration tests against ${serviceUrl}`);
  });

  describe('createAID', () => {
    it('should successfully create an AID with minimal parameters', async () => {
      const request: CreateAIDRequest = {
        alias: `test-aid-${Date.now()}`
      };

      const response = await client.createAID(request);

      expect(response).toBeDefined();
      expect(response.aid).toBeDefined();
      expect(response.aid.alias).toBe(request.alias);
      expect(response.aid.prefix).toBeDefined();
      expect(response.aid.prefix).toBeTypeOf('string');
      expect(response.aid.transferable).toBe(true);
      expect(response.aid.state).toBeDefined();
    });

    it('should create an AID with all parameters specified', async () => {
      const request: CreateAIDRequest = {
        alias: `full-test-aid-${Date.now()}`,
        wits: ['witness1', 'witness2'],
        transferable: false,
        icount: 2,
        ncount: 3
      };

      const response = await client.createAID(request);

      expect(response).toBeDefined();
      expect(response.aid).toBeDefined();
      expect(response.aid.alias).toBe(request.alias);
      expect(response.aid.transferable).toBe(false);
      expect(response.aid.prefix).toBeDefined();
      expect(response.aid.state).toBeDefined();
    });

    it('should handle empty witness array', async () => {
      const request: CreateAIDRequest = {
        alias: `empty-witness-aid-${Date.now()}`,
        wits: [],
        transferable: true
      };

      const response = await client.createAID(request);

      expect(response).toBeDefined();
      expect(response.aid).toBeDefined();
      expect(response.aid.alias).toBe(request.alias);
    });

    it('should throw error with descriptive message on failure', async () => {
      const request: CreateAIDRequest = {
        alias: ''
      };

      await expect(client.createAID(request)).rejects.toThrow(/Failed to create AID/);
    });

    it('should handle network connectivity issues gracefully', async () => {
      const invalidClient = aidClient('http://localhost:9999');
      const request: CreateAIDRequest = {
        alias: `network-test-${Date.now()}`
      };

      await expect(invalidClient.createAID(request)).rejects.toThrow();
    });

    it('should create multiple AIDs with unique aliases', async () => {
      const baseAlias = `batch-test-${Date.now()}`;
      const aids: AID[] = [];

      for (let i = 0; i < 3; i++) {
        const request: CreateAIDRequest = {
          alias: `${baseAlias}-${i}`,
          transferable: i % 2 === 0
        };

        const response = await client.createAID(request);
        aids.push(response.aid);
      }

      expect(aids).toHaveLength(3);

      const aliases = aids.map(aid => aid.alias);
      const uniqueAliases = new Set(aliases);
      expect(uniqueAliases.size).toBe(3);

      const prefixes = aids.map(aid => aid.prefix);
      const uniquePrefixes = new Set(prefixes);
      expect(uniquePrefixes.size).toBe(3);
    });
  });
});