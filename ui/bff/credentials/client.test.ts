import { describe, expect, it, beforeAll } from 'bun:test';
import { credentialsClient } from './client';
import { aidClient } from '../aids/client';
import type { IssueCredentialRequest } from './types';

describe('CredentialsClient Integration Tests', () => {
  const serviceUrl = process.env.CREDENTIALS_SERVICE_URL || 'http://localhost:3001';
  const client = credentialsClient(serviceUrl);
  const aidsClient = aidClient(serviceUrl);
  
  let issuerAlias: string;
  let issuerPrefix: string;
  let subjectAlias: string;
  let subjectPrefix: string;
  
  beforeAll(async () => {
    console.log(`Running integration tests against ${serviceUrl}`);
    
    // Create issuer and subject AIDs for testing
    issuerAlias = `issuer-qvi-${Date.now()}`;
    const issuerResponse = await aidsClient.createAID({
      alias: issuerAlias
    });
    issuerPrefix = issuerResponse.aid.prefix;
    
    subjectAlias = `subject-le-${Date.now()}`;
    const subjectResponse = await aidsClient.createAID({
      alias: subjectAlias
    });
    subjectPrefix = subjectResponse.aid.prefix;
    
    console.log(`Created test AIDs - Issuer: ${issuerAlias} (${issuerPrefix}), Subject: ${subjectAlias} (${subjectPrefix})`);
  });

  describe('issueCredential', () => {
    it('should successfully issue a vLEI credential', async () => {
      // Using a test schema SAID - in real scenarios, this would come from a schema service
      const testSchemaSaid = 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao';
      
      const request: IssueCredentialRequest = {
        issuer: issuerAlias,
        subject: subjectPrefix,
        schemaSaid: testSchemaSaid,
        claims: {
          lei: "5493001KJTIIGC8Y1R12",
          legalName: "Test Corp Ltd",
          registeredCountry: "US"
        },
        edges: {
          assertedBy: issuerPrefix,
          authorizes: subjectPrefix
        }
      };

      const response = await client.issueCredential(request);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.id).toBeTypeOf('string');
      expect(response.acdc).toBeDefined();
      expect(response.anchors).toBeDefined();
      expect(response.anchors.tel).toBeDefined();
    });

    it('should issue credential with full vLEI chain edges', async () => {
      const testSchemaSaid = 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao';
      
      const request: IssueCredentialRequest = {
        issuer: issuerAlias,
        subject: subjectPrefix,
        schemaSaid: testSchemaSaid,
        claims: {
          lei: "984500F0E7D3A9598B24",
          legalName: "Global Test Organization",
          registeredCountry: "GB"
        },
        edges: {
          assertedBy: issuerPrefix,
          authorizes: subjectPrefix,
          chain: [issuerPrefix, "EA_LOU", "EA_GLEIF"]
        },
        status: {
          tel: "internal",
          method: "issue"
        }
      };

      const response = await client.issueCredential(request);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.acdc).toBeDefined();
      expect(response.acdc.a).toBeDefined();
      expect(response.acdc.a.lei).toBe("984500F0E7D3A9598B24");
    });

    it('should handle minimal credential issuance', async () => {
      const testSchemaSaid = 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao';
      
      const request: IssueCredentialRequest = {
        issuer: issuerAlias,
        subject: subjectPrefix,
        schemaSaid: testSchemaSaid,
        claims: {
          simpleField: "test value"
        }
      };

      const response = await client.issueCredential(request);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.acdc).toBeDefined();
    });

    it('should throw error with descriptive message on invalid issuer', async () => {
      const request: IssueCredentialRequest = {
        issuer: 'invalid-issuer-aid',
        subject: subjectPrefix,
        schemaSaid: 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao',
        claims: {
          test: "data"
        }
      };

      await expect(client.issueCredential(request)).rejects.toThrow(/Failed to issue credential/);
    });

    it('should handle network connectivity issues gracefully', async () => {
      const invalidClient = credentialsClient('http://localhost:9999');
      const request: IssueCredentialRequest = {
        issuer: issuerAlias,
        subject: subjectPrefix,
        schemaSaid: 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao',
        claims: {
          test: "network-test"
        }
      };

      await expect(invalidClient.issueCredential(request)).rejects.toThrow();
    });

    it('should issue multiple credentials to different subjects', async () => {
      const testSchemaSaid = 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao';
      const credentialIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        // Create a new subject for each credential
        const subjectResponse = await aidsClient.createAID({
          alias: `subject-${i}-${Date.now()}`
        });
        
        const request: IssueCredentialRequest = {
          issuer: issuerAlias,
          subject: subjectResponse.aid.prefix,
          schemaSaid: testSchemaSaid,
          claims: {
            lei: `549300${i}KJTIIGC8Y1R${i}`,
            legalName: `Test Corp ${i}`,
            registeredCountry: "US"
          }
        };

        const response = await client.issueCredential(request);
        credentialIds.push(response.id);
      }

      expect(credentialIds).toHaveLength(3);
      const uniqueIds = new Set(credentialIds);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('full vLEI workflow', () => {
    it('should complete a full vLEI issuance workflow', async () => {
      const testSchemaSaid = 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao';
      
      // Create new AIDs for clean workflow test
      const qviAlias = `qvi-workflow-${Date.now()}`;
      const qviResponse = await aidsClient.createAID({
        alias: qviAlias
      });
      const leAlias = `le-workflow-${Date.now()}`;
      const leResponse = await aidsClient.createAID({
        alias: leAlias
      });
      
      // Issue vLEI from QVI to Legal Entity
      const issueRequest: IssueCredentialRequest = {
        issuer: qviAlias,  // Use alias for issuer
        subject: leResponse.aid.prefix,  // Use prefix for subject
        schemaSaid: testSchemaSaid,
        claims: {
          lei: "984500WORKFLOW12345",
          legalName: "Workflow Test Corporation",
          registeredCountry: "DE",
          registrationAuthority: "RA000598"
        },
        edges: {
          assertedBy: qviResponse.aid.prefix,
          authorizes: leResponse.aid.prefix,
          chain: [
            qviResponse.aid.prefix,
            "EA_LOU_TEST",
            "EA_GLEIF_TEST"
          ]
        },
        status: {
          tel: "internal",
          method: "issue"
        }
      };

      const response = await client.issueCredential(issueRequest);
      
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.acdc).toBeDefined();
      expect(response.acdc.i).toBe(qviResponse.aid.prefix); // Issuer prefix in ACDC
      expect(response.acdc.a.i).toBe(leResponse.aid.prefix); // Subject
      expect(response.acdc.a.lei).toBe("984500WORKFLOW12345");
      expect(response.anchors.tel).toBeDefined();
    });
  });
});