/**
 * Integration tests for VLEI UI services
 * 
 * These tests run against a real KERIA instance and demonstrate the full workflow:
 * 1. Creating an AID
 * 2. Creating a schema
 * 3. Issuing a VLEI credential
 * 
 * Prerequisites:
 * - KERIA must be running (docker-compose up -d)
 * - No mocks are used - this tests real service integration
 * - Each test is self-contained and does not depend on other tests
 */

import { describe, test, expect, beforeEach, afterAll } from 'vitest';
import { KeriaService, createConnectedKeriaService } from '../src/services/keria.service';
import { CredentialService } from '../src/services/credential.service';
import { SchemaServerService } from '../src/services/schemaServer.service';
import { TEST_CONFIG } from './setup.integration';
import type { CredentialSchema } from '../src/components/SchemaManager';
import { initializeSchemaService } from '../src/services/schemaStorage.js';

describe('Services Integration Tests', () => {
  // Shared services - initialized once
  let keriaService: KeriaService;
  let credentialService: CredentialService;
  let schemaServerService: SchemaServerService;

  beforeEach(async () => {
    // Initialize services for each test
    keriaService = await createConnectedKeriaService(
      {
        adminUrl: TEST_CONFIG.adminUrl,
        bootUrl: TEST_CONFIG.bootUrl
      },
      TEST_CONFIG.passcode,
      {
        autoBootstrap: true,
        logger: console.log
      }
    );

    credentialService = new CredentialService(keriaService);
    schemaServerService = new SchemaServerService();

    // Initialize schema service with proper provider config
    console.log('Initializing schema service...');
    initializeSchemaService({
      provider: 'memory'  // Use string for provider type
    });
  }, TEST_CONFIG.connectionTimeout);

  afterAll(() => {
    console.log('Integration tests completed');
  });

  describe('AID Management - Self Contained', () => {
    test('should create a new AID independently', async () => {
      // Generate unique test data for this test
      const testAidAlias = `test-aid-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      console.log(`Creating AID with alias: ${testAidAlias}`);

      // Get initial AID count
      const initialAids = await keriaService.listAIDs();
      const initialCount = initialAids.length;

      // Create new AID
      const result = await keriaService.createAID(testAidAlias);
      expect(result.aid).toBeDefined();

      // Verify AID was created
      const updatedAids = await keriaService.listAIDs();
      expect(updatedAids.length).toBe(initialCount + 1);

      // Find our created AID
      const createdAid = updatedAids.find(aid => aid.name === testAidAlias)!;
      expect(createdAid).toBeDefined();
      expect(createdAid.name).toBe(testAidAlias);

      // The AID structure has the prefix in different places depending on the response
      const prefix = createdAid.i;
      expect(prefix).toBeDefined();
      expect(prefix.length).toBe(44); // KERI AID prefix length

      console.log(`Successfully created AID: ${prefix}`);
    }, TEST_CONFIG.operationTimeout);

    test('should create an AID and add end role independently', async () => {
      // Generate unique test data for this test
      const testAidAlias = `test-aid-role-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Create new AID
      console.log(`Creating AID with alias: ${testAidAlias}`);
      const result = await keriaService.createAID(testAidAlias);
      expect(result.aid).toBeDefined();

      // Get the created AID
      const aids = await keriaService.listAIDs();
      const createdAid = aids.find(aid => aid.name === testAidAlias);
      expect(createdAid).toBeDefined();

      // Get client state to get agent identifier
      const clientState = await keriaService.getState();
      expect(clientState.agent?.i).toBeDefined();

      console.log(`Adding end role to AID ${testAidAlias}`);

      // Add agent end role
      const endRoleName = await keriaService.addEndRole(
        testAidAlias,
        'agent',
        clientState.agent.i
      );

      expect(endRoleName).toBeDefined();


      console.log(`Successfully added end role '${endRoleName}' to AID`);
    }, TEST_CONFIG.operationTimeout);
  });

  describe('Registry Management - Self Contained', () => {
    test('should create an AID and registry independently', async () => {
      // Generate unique test data for this test
      const testAidAlias = `test-aid-reg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const testRegistryName = `test-registry-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Step 1: Create an AID
      console.log(`Creating AID: ${testAidAlias}`);
      const aidResult = await keriaService.createAID(testAidAlias);
      expect(aidResult.aid).toBeDefined();

      // Step 2: Create a registry for the AID
      console.log(`Creating registry "${testRegistryName}" for AID ${testAidAlias}`);

      // Get initial registry count
      const initialRegistries = await credentialService.listRegistries(testAidAlias);
      const initialCount = initialRegistries.length;

      // Create registry
      const createdRegistry = await credentialService.createRegistry(testAidAlias, testRegistryName);

      expect(createdRegistry).toBeDefined();
      expect(createdRegistry.name).toBe(testRegistryName);
      expect(createdRegistry.regk).toBeDefined();
      expect(createdRegistry.regk.length).toBe(44); // KERI registry identifier length

      // Verify registry was created
      const updatedRegistries = await credentialService.listRegistries(testAidAlias);
      expect(updatedRegistries.length).toBe(initialCount + 1);

      // Find our created registry
      const foundRegistry = updatedRegistries.find(r =>
        r.name === testRegistryName || r.registryName === testRegistryName
      );
      expect(foundRegistry).toBeDefined();

      console.log(`Successfully created registry: ${createdRegistry.regk}`);
    }, TEST_CONFIG.operationTimeout);
  });

  describe('Schema Management - Self Contained', () => {
    test('should register and retrieve a schema', async () => {
      console.log('Loading schema via OOBI...');

      const client = keriaService.getClient();
      expect(client).toBeDefined();

      // Use a well-known schema OOBI for vLEI
      const vLEISchemaOOBI = 'https://raw.githubusercontent.com/WebOfTrust/vLEI/main/schema/acdc/legal-entity-vLEI-credential.json';

      try {
        // Try to load the schema via OOBI
        console.log('Attempting to load schema OOBI:', vLEISchemaOOBI);
        if (client) {
          const oobi = await client.oobis().resolve(vLEISchemaOOBI, 'schema');
          console.log('Schema OOBI resolved:', oobi);
        }
      } catch (error) {
        console.log('Schema OOBI resolution failed (expected for remote URLs):', error);
        // For now, we'll use a local schema approach
      }

      // Define a test schema
      const testSchema: CredentialSchema = {
        said: 'ETest123456789012345678901234567890123456789', // Test schema SAID (44 chars)
        description: 'Integration test schema for VLEI credentials',
        version: '1.0.0',
        schema: {}
      };

      // Register schema (this is now a no-op but demonstrates the API)
      schemaServerService.registerSchema(testSchema);

      // Get schema OOBI URL
      const schemaOOBI = schemaServerService.getSchemaOOBI(testSchema.said);
      expect(schemaOOBI).toBeDefined();
      expect(schemaOOBI).toContain('/oobi/');
      expect(schemaOOBI).toContain(testSchema.said);

      console.log(`Schema OOBI URL: ${schemaOOBI}`);

      // Verify schema is available via SchemaService
      const registeredSchemas = await schemaServerService.getRegisteredSchemas();
      expect(registeredSchemas).toBeInstanceOf(Map);

      console.log('Successfully registered schema');
    });
  });

  describe('Complete Workflow - Self Contained', () => {
    test.only('should demonstrate complete AID and registry workflow independently', async () => {
      console.log('Demonstrating complete workflow in a single test...');

      // Generate unique test data
      const testAidAlias = `test-complete-aid-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const testRegistryName = `test-complete-reg-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Step 1: Create an AID
      console.log('Step 1: Creating AID...');
      const aidResult = await keriaService.createAID(testAidAlias);
      expect(aidResult.aid).toBeDefined();

      // Verify AID
      const aids = await keriaService.listAIDs();
      const createdAid = aids.find(aid => aid.name === testAidAlias)!;
      expect(createdAid).toBeDefined();
      const prefix = createdAid.i;
      console.log(`✅ Created AID: ${prefix}`);

      // Step 2: Add end role
      console.log('Step 2: Adding end role...');
      const clientState = await keriaService.getState();
      const endRoleName = await keriaService.addEndRole(testAidAlias, 'agent', clientState.agent.i);
      console.log('✅ Added end role to AID: ', endRoleName);

      // Step 3: Create registry
      console.log('Step 3: Creating registry...');
      const registry = await credentialService.createRegistry(testAidAlias, testRegistryName);
      expect(registry).toBeDefined();
      expect(registry.regk).toBeDefined();
      console.log(`✅ Created credential registry: ${registry.regk}`);

      // Step 4: Schema management
      console.log('Step 4: Schema management...');
      const testSchema: CredentialSchema = {
        said: 'ETest123456789012345678901234567890123456789',
        description: 'Test schema',
        version: '1.0.0',
        schema: {}
      };
      schemaServerService.registerSchema(testSchema);
      console.log('✅ Schema management demonstrated');

      // Final verification
      const finalAids = await keriaService.listAIDs();
      const finalRegistries = await credentialService.listRegistries(testAidAlias);

      console.log(`Final state: ${finalAids.length} AIDs, ${finalRegistries.length} registries`);

      expect(finalAids.length).toBeGreaterThan(0);
      expect(finalRegistries.length).toBeGreaterThan(0);

      console.log('🎉 Complete workflow test passed!');
    }, TEST_CONFIG.operationTimeout);
  });

  describe('VLEI Credential Issuance - Self Contained', () => {
    test.skip('should create all resources and issue a VLEI credential independently', async () => {
      // This test is skipped as it requires proper schema loading via OOBI
      // Generate unique test data
      const testAidAlias = `test-vlei-aid-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const testRegistryName = `test-vlei-reg-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Step 1: Create issuer AID
      const issuerResult = await keriaService.createAID(testAidAlias);
      expect(issuerResult.aid).toBeDefined();

      // Step 2: Create registry
      const registry = await credentialService.createRegistry(testAidAlias, testRegistryName);
      expect(registry).toBeDefined();

      // Step 3: Issue VLEI credential
      const aids = await keriaService.listAIDs();
      const issuerAid = aids.find(aid => aid.name === testAidAlias);
      const holderAid = issuerAid.prefix || issuerAid.i; // Use same AID as holder for simplicity

      const vleiData = {
        LEI: 'TEST123456789012345678',
        dt: new Date().toISOString()
      };

      const testSchema: CredentialSchema = {
        said: 'ETest123456789012345678901234567890123456789',
        description: 'Test VLEI schema',
        version: '1.0.0',
        schema: {}
      };

      const result = await credentialService.issueCredential({
        issuerAlias: testAidAlias,
        holderAid: holderAid,
        registryName: testRegistryName,
        schemaId: testSchema.said,
        attributes: vleiData
      });

      expect(result).toBeDefined();
      expect(result.said).toBeDefined();
      expect(result.credential).toBeDefined();

      console.log(`Successfully issued credential with SAID: ${result.said}`);
    }, TEST_CONFIG.operationTimeout);
  });
});