import { describe, expect, it, beforeAll } from 'bun:test';
import { aidClient } from './client';
import type { AID, CreateAIDRequest, SignRequest, VerifyRequest, RotateRequest, EventsRequest } from './types';
import { KeriaClient } from './impl/KeriaClient';

describe('AIDClient Integration Tests', () => {
  const serviceUrl = process.env.AID_SERVICE_URL || 'http://localhost:3001';

  beforeAll(() => {
    console.log(`Running integration tests against ${serviceUrl}`);
  });

  // AIDs are now created individually in each test to avoid isolation issues

  describe('createAID', () => {
    it('should successfully create an AID with minimal parameters', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
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

    it('should create a transferable AID', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
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
    });

    it('should create an AID with all parameters specified', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
      const request: CreateAIDRequest = {
        alias: `full-test-aid-${Date.now()}`,
        wits: [
          'BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha', // Valid witness ID (Wan)
          'BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM'  // Valid witness ID (Wes)
        ],
        transferable: true, // Changed to true since witnesses require transferable AIDs
        icount: 2,
        ncount: 3
      };

      const response = await client.createAID(request);

      expect(response).toBeDefined();
      expect(response.aid).toBeDefined();
      expect(response.aid.alias).toBe(request.alias);
      expect(response.aid.transferable).toBe(true); // Updated expectation
      expect(response.aid.prefix).toBeDefined();
      expect(response.aid.state).toBeDefined();
    });

    it('should handle empty witness array', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
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
      // Create a fresh client for this test
      const client = aidClient(serviceUrl);
      
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
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
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
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
      // Create a fresh AID for this test
      const aidResponse = await client.createAID({
        alias: `sign-test-${Date.now()}`
      });
      
      const request: SignRequest = {
        alias: aidResponse.aid.alias,
        text: 'Hello World'
      };

      const response = await client.signMessage(request);

      expect(response).toBeDefined();
      expect(response.signature).toBeDefined();
      expect(response.signature).toBeTypeOf('string');
      expect(response.signature.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent AID alias', async () => {
      // Create a fresh client for this test
      const client = aidClient(serviceUrl);
      
      const request: SignRequest = {
        alias: 'non-existent-aid',
        text: 'Hello World'
      };

      await expect(client.signMessage(request)).rejects.toThrow(/Failed to sign message/);
    });

    it('should handle empty text gracefully', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
      // Create a fresh AID for this test
      const aidResponse = await client.createAID({
        alias: `empty-text-test-${Date.now()}`
      });
      
      const request: SignRequest = {
        alias: aidResponse.aid.alias,
        text: ''
      };

      await expect(client.signMessage(request)).rejects.toThrow();
    });
  });

  describe('verifySignature', () => {
    const testMessage = 'Test message for verification';

    it('should successfully verify a valid signature', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
      // Create a fresh AID for this test
      const aidResponse = await client.createAID({
        alias: `verify-test-${Date.now()}`
      });
      
      // First create a signature to verify
      const signResponse = await client.signMessage({
        alias: aidResponse.aid.alias,
        text: testMessage
      });
      
      const request: VerifyRequest = {
        alias: aidResponse.aid.alias,
        text: testMessage,
        signature: signResponse.signature
      };

      const response = await client.verifySignature(request);

      expect(response).toBeDefined();
      expect(response.valid).toBe(true);
      expect(response.prefix).toBeDefined();
      expect(response.prefix).toBe(aidResponse.aid.prefix);
    });

    it('should fail verification with tampered signature', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
      // Create a fresh AID for this test
      const aidResponse = await client.createAID({
        alias: `tamper-sig-test-${Date.now()}`
      });
      
      // First create a valid signature
      const signResponse = await client.signMessage({
        alias: aidResponse.aid.alias,
        text: testMessage
      });
      
      const tamperedSignature = signResponse.signature.slice(0, -1) + 'X'; // Change last character
      
      const request: VerifyRequest = {
        alias: aidResponse.aid.alias,
        text: testMessage,
        signature: tamperedSignature
      };

      const response = await client.verifySignature(request);

      expect(response).toBeDefined();
      expect(response.valid).toBe(false);
    });

    it('should fail verification with tampered text', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
      // Create a fresh AID for this test
      const aidResponse = await client.createAID({
        alias: `tamper-text-test-${Date.now()}`
      });
      
      // First create a valid signature
      const signResponse = await client.signMessage({
        alias: aidResponse.aid.alias,
        text: testMessage
      });
      
      const request: VerifyRequest = {
        alias: aidResponse.aid.alias,
        text: testMessage + ' tampered',
        signature: signResponse.signature
      };

      const response = await client.verifySignature(request);

      expect(response).toBeDefined();
      expect(response.valid).toBe(false);
    });

    it('should verify with explicit prefix', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
      // Create a fresh AID for this test
      const aidResponse = await client.createAID({
        alias: `prefix-verify-test-${Date.now()}`
      });
      
      // First create a valid signature
      const signResponse = await client.signMessage({
        alias: aidResponse.aid.alias,
        text: testMessage
      });
      
      const request: VerifyRequest = {
        alias: aidResponse.aid.alias,
        text: testMessage,
        signature: signResponse.signature,
        prefix: aidResponse.aid.prefix
      };

      const response = await client.verifySignature(request);

      expect(response).toBeDefined();
      expect(response.valid).toBe(true);
      expect(response.prefix).toBe(aidResponse.aid.prefix);
    });
  });

  describe('rotateKeys', () => {
    it('should successfully rotate keys for transferable AID', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
      // Create a fresh transferable AID for this test
      const aidResponse = await client.createAID({
        alias: `rotate-main-test-${Date.now()}`,
        transferable: true,
        icount: 1,
        ncount: 1
      });
      
      const request: RotateRequest = {
        alias: aidResponse.aid.alias
      };

      const response = await client.rotateKeys(request);

      expect(response).toBeDefined();
      expect(response.prefix).toBe(aidResponse.aid.prefix);
      expect(response.alias).toBe(aidResponse.aid.alias);
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

      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
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
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
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
      // Create a fresh client for this test
      const client = aidClient(serviceUrl);
      
      const request: RotateRequest = {
        alias: 'non-existent-aid-for-rotation'
      };

      await expect(client.rotateKeys(request)).rejects.toThrow(/Failed to rotate keys/);
    });
  });

  describe('listEvents', () => {
    it('should successfully list events for an existing AID', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
      // Create a fresh AID for this test
      const aidResponse = await client.createAID({
        alias: `events-list-test-${Date.now()}`
      });
      
      const request: EventsRequest = {
        alias: aidResponse.aid.alias
      };

      const response = await client.listEvents(request);

      expect(response).toBeDefined();
      expect(response.alias).toBe(aidResponse.aid.alias);
      expect(response.prefix).toBe(aidResponse.aid.prefix);
      expect(response.events).toBeDefined();
      expect(Array.isArray(response.events)).toBe(true);
      expect(response.total).toBeTypeOf('number');
      expect(response.total).toBeGreaterThanOrEqual(0);
    });

    it('should list events with pagination', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
      // Create a fresh AID for this test
      const aidResponse = await client.createAID({
        alias: `events-pagination-test-${Date.now()}`
      });
      
      const request: EventsRequest = {
        alias: aidResponse.aid.alias,
        limit: 5,
        offset: 0
      };

      const response = await client.listEvents(request);

      expect(response).toBeDefined();
      expect(response.events).toBeDefined();
      expect(Array.isArray(response.events)).toBe(true);
      expect(response.events.length).toBeLessThanOrEqual(5);
      expect(response.total).toBeTypeOf('number');
    });

    it('should handle events listing with custom pagination parameters', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
      // Create a fresh transferable AID for this test
      const aidResponse = await client.createAID({
        alias: `events-custom-test-${Date.now()}`,
        transferable: true
      });
      
      const request: EventsRequest = {
        alias: aidResponse.aid.alias,
        limit: 10,
        offset: 0
      };

      const response = await client.listEvents(request);

      expect(response).toBeDefined();
      expect(response.alias).toBe(aidResponse.aid.alias);
      expect(response.events).toBeDefined();
      expect(response.events.length).toBeLessThanOrEqual(10);
      
      // Each event should have the expected structure
      if (response.events.length > 0) {
        const event = response.events[0];
        expect(event).toBeDefined();
        expect(event.sequence).toBeTypeOf('number');
        expect(event.eventType).toBeTypeOf('string');
        expect(event.digest).toBeTypeOf('string');
        expect(Array.isArray(event.signatures)).toBe(true);
        expect(event.data).toBeDefined();
      }
    });

    it('should throw error for non-existent AID alias', async () => {
      // Create a fresh client for this test
      const client = aidClient(serviceUrl);
      
      const request: EventsRequest = {
        alias: 'non-existent-aid-for-events'
      };

      await expect(client.listEvents(request)).rejects.toThrow(/Failed to list events/);
    });

    it('should handle empty alias gracefully', async () => {
      // Create a fresh client for this test
      const client = aidClient(serviceUrl);
      
      const request: EventsRequest = {
        alias: ''
      };

      await expect(client.listEvents(request)).rejects.toThrow();
    });

    it('should list events after performing operations', async () => {
      // Create a fresh client with unique bran for this test
      const client = aidClient(serviceUrl);
      const bran = KeriaClient.generateBran();
      client.setBran(bran);
      
      // Create a new AID for this test
      const testAlias = `events-test-${Date.now()}`;
      const createResponse = await client.createAID({
        alias: testAlias,
        transferable: true
      });

      expect(createResponse.aid).toBeDefined();

      // List events immediately after creation
      const eventsResponse = await client.listEvents({
        alias: testAlias
      });

      expect(eventsResponse).toBeDefined();
      expect(eventsResponse.alias).toBe(testAlias);
      expect(eventsResponse.prefix).toBe(createResponse.aid.prefix);
      expect(eventsResponse.events).toBeDefined();
      expect(eventsResponse.total).toBeGreaterThan(0); // Should have at least the inception event
      
      // Check that we have at least one event (the inception)
      expect(eventsResponse.events.length).toBeGreaterThan(0);
      
      // The first event should be an inception event
      const firstEvent = eventsResponse.events[0];
      expect(firstEvent.eventType).toMatch(/icp|inception/i);
      expect(firstEvent.sequence).toBeGreaterThanOrEqual(0);
    });
  });
});

// Additional integration test for complete workflow
describe('AID Complete Workflow Integration', () => {
  const serviceUrl = process.env.AID_SERVICE_URL || 'http://localhost:3001';

  it('should complete full AID lifecycle: create -> sign -> verify -> rotate', async () => {
    // Create a fresh client with unique bran for this test
    const client = aidClient(serviceUrl);
    const bran = KeriaClient.generateBran();
    client.setBran(bran);
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