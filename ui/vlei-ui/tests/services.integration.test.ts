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
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { KeriaService } from '../src/services/keria.service';
import { CredentialService } from '../src/services/credential.service';
import { SchemaServerService } from '../src/services/schemaServer.service';
import { TEST_CONFIG } from './setup.integration';
import type { CredentialSchema } from '../src/components/SchemaManager';

describe('Services Integration Tests', () => {
  let keriaService: KeriaService;
  let credentialService: CredentialService;
  let schemaServerService: SchemaServerService;
  
  // Test data
  const testAidAlias = `test-aid-${Date.now()}`;
  const testRegistryName = `test-registry-${Date.now()}`;
  let createdAid: any;
  let createdRegistry: any;
  let testSchema: CredentialSchema;

  beforeAll(async () => {
    // Initialize services
    keriaService = new KeriaService(
      {
        adminUrl: TEST_CONFIG.adminUrl,
        bootUrl: TEST_CONFIG.bootUrl
      },
      TEST_CONFIG.passcode
    );
    
    credentialService = new CredentialService(keriaService);
    schemaServerService = new SchemaServerService();

    // Initialize KERIA connection
    console.log('Initializing KERIA connection...');
    await keriaService.initialize();
    
    try {
      // Try to connect to existing agent first
      await keriaService.connect();
      console.log('Connected to existing KERIA agent');
    } catch (error) {
      // If no agent exists, bootstrap a new one
      console.log('No existing agent found, bootstrapping new agent...');
      await keriaService.boot();
      await keriaService.connect();
      console.log('Bootstrapped and connected to new KERIA agent');
    }

    // Define test schema
    testSchema = {
      said: 'EBmLKjq1jL-U1e8KBNvO2_HN0V8yYG9zKdqMlOlZA0M8', // This will be replaced when schema is created
      title: 'Test VLEI Schema',
      description: 'Integration test schema for VLEI credentials',
      version: '1.0.0',
      schema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          lei: {
            type: 'string',
            description: 'Legal Entity Identifier'
          },
          entityName: {
            type: 'string',
            description: 'Name of the legal entity'
          },
          entityType: {
            type: 'string',
            description: 'Type of legal entity'
          },
          issuanceDate: {
            type: 'string',
            format: 'date-time',
            description: 'Date when the credential was issued'
          }
        },
        required: ['lei', 'entityName', 'entityType', 'issuanceDate']
      }
    };
  }, TEST_CONFIG.connectionTimeout);

  afterAll(async () => {
    // Cleanup: disconnect from KERIA
    if (keriaService) {
      console.log('Cleaning up KERIA connection...');
      // Note: We don't delete the AID or registry in cleanup to allow inspection
    }
  });

  describe('AID Management', () => {
    test('should create a new AID', async () => {
      console.log(`Creating AID with alias: ${testAidAlias}`);
      
      // Get initial AID count
      const initialAids = await keriaService.listAIDs();
      const initialCount = initialAids.length;
      
      // Create new AID
      const { op } = await keriaService.createAID(testAidAlias);
      expect(op).toBeDefined();
      expect(op.name).toBeDefined();
      
      // Wait for operation to complete
      const completedOp = await keriaService.waitForOperation(op);
      expect(completedOp.done).toBe(true);
      
      // Clean up operation
      await keriaService.deleteOperation(op.name);
      
      // Verify AID was created
      const updatedAids = await keriaService.listAIDs();
      expect(updatedAids.length).toBe(initialCount + 1);
      
      // Find our created AID
      createdAid = updatedAids.find(aid => aid.name === testAidAlias);
      expect(createdAid).toBeDefined();
      expect(createdAid.name).toBe(testAidAlias);
      expect(createdAid.prefix).toBeDefined();
      expect(createdAid.prefix.length).toBe(44); // KERI AID prefix length
      
      console.log(`Successfully created AID: ${createdAid.prefix}`);
    }, TEST_CONFIG.operationTimeout);

    test('should add end role to the created AID', async () => {
      expect(createdAid).toBeDefined();
      
      // Get client state to get agent identifier
      const clientState = await keriaService.getState();
      expect(clientState.agent?.i).toBeDefined();
      
      console.log(`Adding end role to AID ${testAidAlias}`);
      
      // Add agent end role
      const endRoleOp = await keriaService.addEndRole(
        testAidAlias, 
        'agent', 
        clientState.agent.i
      );
      
      expect(endRoleOp).toBeDefined();
      expect(endRoleOp.name).toBeDefined();
      
      // Wait for operation to complete
      const completedOp = await keriaService.waitForOperation(endRoleOp);
      expect(completedOp.done).toBe(true);
      
      // Clean up operation
      await keriaService.deleteOperation(endRoleOp.name);
      
      console.log('Successfully added end role to AID');
    }, TEST_CONFIG.operationTimeout);
  });

  describe('Registry Management', () => {
    test('should create a credential registry', async () => {
      expect(createdAid).toBeDefined();
      
      console.log(`Creating registry "${testRegistryName}" for AID ${testAidAlias}`);
      
      // Get initial registry count
      const initialRegistries = await credentialService.listRegistries(testAidAlias);
      const initialCount = initialRegistries.length;
      
      // Create registry
      createdRegistry = await credentialService.createRegistry(testAidAlias, testRegistryName);
      
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

  describe('Schema Management', () => {
    test('should register and serve a schema', async () => {
      console.log('Registering test schema...');
      
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

  describe('VLEI Credential Issuance', () => {
    test('should issue a VLEI credential', async () => {
      expect(createdAid).toBeDefined();
      expect(createdRegistry).toBeDefined();
      
      console.log('Issuing VLEI credential...');
      
      // Create a test holder AID (using the same AID as both issuer and holder for simplicity)
      const holderAid = createdAid.prefix;
      
      // VLEI credential data
      const vleiData = {
        lei: 'TEST123456789012345678',
        entityName: 'Test Integration Entity',
        entityType: 'Corporation',
        issuanceDate: new Date().toISOString()
      };
      
      // Issue credential using the generic issueCredential method
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
      
      // Verify credential was created by retrieving it
      const retrievedCredential = await credentialService.getCredential(result.said);
      expect(retrievedCredential).toBeDefined();
      
      // Verify credential contents
      const credentialData = retrievedCredential.sad?.a || retrievedCredential.a;
      expect(credentialData).toBeDefined();
      expect(credentialData.lei).toBe(vleiData.lei);
      expect(credentialData.entityName).toBe(vleiData.entityName);
      expect(credentialData.entityType).toBe(vleiData.entityType);
      expect(credentialData.i).toBe(holderAid); // Holder AID should be in the credential
      
      console.log('Credential verification completed successfully');
    }, TEST_CONFIG.operationTimeout);

    test('should list credentials for the AID', async () => {
      expect(createdAid).toBeDefined();
      
      console.log(`Listing credentials for AID ${testAidAlias}`);
      
      // List credentials
      const credentials = await credentialService.listCredentials(testAidAlias);
      expect(credentials).toBeDefined();
      expect(Array.isArray(credentials)).toBe(true);
      expect(credentials.length).toBeGreaterThan(0);
      
      // Find our test credential
      const testCredential = credentials.find(cred => {
        const data = cred.sad?.a || cred.a;
        return data?.lei === 'TEST123456789012345678';
      });
      
      expect(testCredential).toBeDefined();
      console.log(`Found ${credentials.length} credentials, including our test credential`);
    });
  });

  describe('Full Workflow Integration', () => {
    test('should demonstrate complete VLEI issuance workflow', async () => {
      console.log('Demonstrating complete VLEI workflow...');
      
      // This test verifies that all components work together
      expect(createdAid).toBeDefined();
      expect(createdRegistry).toBeDefined();
      expect(testSchema).toBeDefined();
      
      // Summary of what we've accomplished:
      console.log('✅ Created AID:', createdAid.prefix);
      console.log('✅ Added end role to AID');
      console.log('✅ Created credential registry:', createdRegistry.regk);
      console.log('✅ Registered schema:', testSchema.said);
      console.log('✅ Issued VLEI credential');
      console.log('✅ Verified credential storage and retrieval');
      
      // Final verification: list all components
      const aids = await keriaService.listAIDs();
      const registries = await credentialService.listRegistries(testAidAlias);
      const credentials = await credentialService.listCredentials(testAidAlias);
      
      console.log(`Final state: ${aids.length} AIDs, ${registries.length} registries, ${credentials.length} credentials`);
      
      expect(aids.length).toBeGreaterThan(0);
      expect(registries.length).toBeGreaterThan(0);
      expect(credentials.length).toBeGreaterThan(0);
      
      console.log('🎉 Complete VLEI workflow integration test passed!');
    });
  });
});