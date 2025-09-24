import { describe, expect, it, beforeAll } from 'bun:test';
import { aidClient } from './client';
import type { AID, CreateAIDRequest, SignRequest, VerifyRequest, RotateRequest } from './types';
import { KeriaClient } from './impl/KeriaClient';

describe('AIDClient Integration Tests', () => {
  const serviceUrl = process.env.AID_SERVICE_URL || 'http://localhost:3001';
  const client = aidClient(serviceUrl);
  const bran = KeriaClient.generateBran()
  client.setBran(bran)

  beforeAll(() => {
    console.log(`Running integration tests against ${serviceUrl}`);
  });

  // Store created AIDs for use in other tests
  let testAID: AID;
  let transferableAID: AID;

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
      
      // Store for later tests
      testAID = response.aid;
    });

    it('should create a transferable AID for rotation tests', async () => {
      const request: CreateAIDRequest = {
        alias: `transferable-aid-${Date.now()}`,
        transferable: true,
        icount: 1,
        ncount: 1
      };

      const response = await client.createAID(request);

      expect(response).toBeDefined();
      expect(response.aid).toBeDefined();
      expect(response.aid.alias).toBe(request.alias);
      expect(response.aid.transferable).toBe(true);
      expect(response.aid.prefix).toBeDefined();
      expect(response.aid.state).toBeDefined();
      
      // Store for rotation tests
      transferableAID = response.aid;
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

  describe('signMessage', () => {
    it('should successfully sign a message', async () => {
      const request: SignRequest = {
        alias: testAID.alias,
        text: 'Hello World'
      };

      const response = await client.signMessage(request);

      expect(response).toBeDefined();
      expect(response.signature).toBeDefined();
      expect(response.signature).toBeTypeOf('string');
      expect(response.signature.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent AID alias', async () => {
      const request: SignRequest = {
        alias: 'non-existent-aid',
        text: 'Hello World'
      };

      await expect(client.signMessage(request)).rejects.toThrow(/Failed to sign message/);
    });

    it('should handle empty text gracefully', async () => {
      const request: SignRequest = {
        alias: testAID.alias,
        text: ''
      };

      await expect(client.signMessage(request)).rejects.toThrow();
    });
  });

  describe('verifySignature', () => {
    let signature: string;
    const testMessage = 'Test message for verification';

    it('should successfully verify a valid signature', async () => {
      // First create a signature to verify
      const signResponse = await client.signMessage({
        alias: testAID.alias,
        text: testMessage
      });
      
      const request: VerifyRequest = {
        alias: testAID.alias,
        text: testMessage,
        signature: signResponse.signature
      };

      const response = await client.verifySignature(request);

      expect(response).toBeDefined();
      expect(response.valid).toBe(true);
      expect(response.prefix).toBeDefined();
      expect(response.prefix).toBe(testAID.prefix);
    });

    it('should fail verification with tampered signature', async () => {
      // First create a valid signature
      const signResponse = await client.signMessage({
        alias: testAID.alias,
        text: testMessage
      });
      
      const tamperedSignature = signResponse.signature.slice(0, -1) + 'X'; // Change last character
      
      const request: VerifyRequest = {
        alias: testAID.alias,
        text: testMessage,
        signature: tamperedSignature
      };

      const response = await client.verifySignature(request);

      expect(response).toBeDefined();
      expect(response.valid).toBe(false);
    });

    it('should fail verification with tampered text', async () => {
      // First create a valid signature
      const signResponse = await client.signMessage({
        alias: testAID.alias,
        text: testMessage
      });
      
      const request: VerifyRequest = {
        alias: testAID.alias,
        text: testMessage + ' tampered',
        signature: signResponse.signature
      };

      const response = await client.verifySignature(request);

      expect(response).toBeDefined();
      expect(response.valid).toBe(false);
    });

    it('should verify with explicit prefix', async () => {
      // First create a valid signature
      const signResponse = await client.signMessage({
        alias: testAID.alias,
        text: testMessage
      });
      
      const request: VerifyRequest = {
        alias: testAID.alias,
        text: testMessage,
        signature: signResponse.signature,
        prefix: testAID.prefix
      };

      const response = await client.verifySignature(request);

      expect(response).toBeDefined();
      expect(response.valid).toBe(true);
      expect(response.prefix).toBe(testAID.prefix);
    });
  });

  describe('rotateKeys', () => {
    it('should successfully rotate keys for transferable AID', async () => {
      const request: RotateRequest = {
        alias: transferableAID.alias
      };

      const response = await client.rotateKeys(request);

      expect(response).toBeDefined();
      expect(response.prefix).toBe(transferableAID.prefix);
      expect(response.alias).toBe(transferableAID.alias);
      expect(response.sequence).toBeTypeOf('number');
      expect(response.sequence).toBeGreaterThan(0);
      expect(response.publicKey).toBeDefined();
      expect(response.publicKey).toBeTypeOf('string');
    });

    it('should rotate keys with custom parameters', async () => {
      const request: RotateRequest = {
        alias: `rotate-test-aid-${Date.now()}`,
        count: 1,
        ncount: 1
      };

      // First create a transferable AID for this test
      const aidResponse = await client.createAID({
        alias: request.alias,
        transferable: true,
        icount: 1,
        ncount: 1
      });

      // Now rotate its keys
      const rotateResponse = await client.rotateKeys(request);

      expect(rotateResponse).toBeDefined();
      expect(rotateResponse.prefix).toBe(aidResponse.aid.prefix);
      expect(rotateResponse.alias).toBe(request.alias);
      expect(rotateResponse.sequence).toBe(1); // First rotation
    });

    it('should fail to rotate keys for non-transferable AID', async () => {
      // Create a non-transferable AID
      const nonTransferableAlias = `non-transferable-${Date.now()}`;
      await client.createAID({
        alias: nonTransferableAlias,
        transferable: false
      });

      const request: RotateRequest = {
        alias: nonTransferableAlias
      };

      await expect(client.rotateKeys(request)).rejects.toThrow();
    });

    it('should throw error for non-existent AID', async () => {
      const request: RotateRequest = {
        alias: 'non-existent-aid-for-rotation'
      };

      await expect(client.rotateKeys(request)).rejects.toThrow(/Failed to rotate keys/);
    });
  });
});

// Additional integration test for complete workflow
describe('AID Complete Workflow Integration', () => {
  const serviceUrl = process.env.AID_SERVICE_URL || 'http://localhost:3001';
  const client = aidClient(serviceUrl);
  const bran = KeriaClient.generateBran();
  client.setBran(bran);

  it('should complete full AID lifecycle: create -> sign -> verify -> rotate', async () => {
    // Step 1: Create AID
    const aidAlias = `workflow-test-${Date.now()}`;
    const createResponse = await client.createAID({
      alias: aidAlias,
      transferable: true
    });

    expect(createResponse.aid).toBeDefined();
    const aid = createResponse.aid;

    // Step 2: Sign a message
    const testMessage = 'Complete workflow test message';
    const signResponse = await client.signMessage({
      alias: aidAlias,
      text: testMessage
    });

    expect(signResponse.signature).toBeDefined();

    // Step 3: Verify the signature
    const verifyResponse = await client.verifySignature({
      alias: aidAlias,
      text: testMessage,
      signature: signResponse.signature
    });

    expect(verifyResponse.valid).toBe(true);
    expect(verifyResponse.prefix).toBe(aid.prefix);

    // Step 4: Rotate keys
    const rotateResponse = await client.rotateKeys({
      alias: aidAlias
    });

    expect(rotateResponse.prefix).toBe(aid.prefix); // Prefix remains same
    expect(rotateResponse.sequence).toBe(1); // First rotation
    expect(rotateResponse.publicKey).toBeDefined();

    // Step 5: Verify that old signature is still valid with original keys
    // (This might fail depending on KERI implementation details)
    const verifyAfterRotation = await client.verifySignature({
      alias: aidAlias,
      text: testMessage,
      signature: signResponse.signature
    });

    // The signature should still be valid as it was signed before rotation
    expect(verifyAfterRotation.valid).toBe(true);
  });
});