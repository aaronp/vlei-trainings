import { describe, expect, it, beforeAll } from 'bun:test';
import { credentialsClient } from './client';
import { aidClient } from '../aids/client';
import { oobiClient } from '../oobi/client';
import type { IssueCredentialRequest } from './types';

describe('CredentialsClient Integration Tests', () => {
  const serviceUrl = process.env.CREDENTIALS_SERVICE_URL || 'http://localhost:3001';
  const client = credentialsClient(serviceUrl);
  const aidsClient = aidClient(serviceUrl);
  const oobiClientInstance = oobiClient(serviceUrl);
  
  let issuerAlias: string;
  let issuerPrefix: string;
  let subjectAlias: string;
  let subjectPrefix: string;
  
  // Use the actual vLEI Legal Entity schema SAID
  const testSchemaSaid = 'ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY';
  const vleiServerUrl = 'http://localhost:7723';
  
  beforeAll(async () => {
    console.log(`Running integration tests against ${serviceUrl}`);
    
    // First resolve the schema OOBI so it's available for credential issuance
    console.log(`Resolving schema OOBI for ${testSchemaSaid}...`);
    try {
      await oobiClientInstance.resolveOOBI({
        oobi: `${vleiServerUrl}/oobi/${testSchemaSaid}`,
        alias: `schema-${testSchemaSaid}`
      });
      console.log(`Successfully resolved schema OOBI`);
    } catch (error) {
      console.log(`OOBI resolution failed (might already be resolved): ${error}`);
    }
    
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
      // Using the actual vLEI Legal Entity schema SAID
      
      const request: IssueCredentialRequest = {
        issuer: issuerAlias,
        subject: subjectPrefix,
        schemaSaid: testSchemaSaid,
        claims: {
          LEI: "5493001KJTIIGC8Y1R12",
          dt: new Date().toISOString(),
          i: subjectPrefix
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
      
      const request: IssueCredentialRequest = {
        issuer: issuerAlias,
        subject: subjectPrefix,
        schemaSaid: testSchemaSaid,
        claims: {
          LEI: "984500F0E7D3A9598B24",
          dt: new Date().toISOString(),
          i: subjectPrefix
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
      expect(response.acdc.a.LEI).toBe("984500F0E7D3A9598B24");
    });

    it('should handle minimal credential issuance', async () => {
      
      const request: IssueCredentialRequest = {
        issuer: issuerAlias,
        subject: subjectPrefix,
        schemaSaid: testSchemaSaid,
        claims: {
          LEI: "TEST123456789012",
          dt: new Date().toISOString(),
          i: subjectPrefix
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
        schemaSaid: testSchemaSaid,
        claims: {
          LEI: "INVALID12345678901",
          dt: new Date().toISOString(),
          i: subjectPrefix
        }
      };

      await expect(client.issueCredential(request)).rejects.toThrow(/Failed to issue credential/);
    });

    it('should handle network connectivity issues gracefully', async () => {
      const invalidClient = credentialsClient('http://localhost:9999');
      const request: IssueCredentialRequest = {
        issuer: issuerAlias,
        subject: subjectPrefix,
        schemaSaid: testSchemaSaid,
        claims: {
          LEI: "NETWORK12345678901",
          dt: new Date().toISOString(),
          i: subjectPrefix
        }
      };

      await expect(invalidClient.issueCredential(request)).rejects.toThrow();
    });

    it('should issue multiple credentials to different subjects', async () => {
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
            LEI: `549300${i}KJTIIGC8Y1R${i}`,
            dt: new Date().toISOString(),
            i: subjectResponse.aid.prefix
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
          LEI: "984500WORKFLOW12345",
          dt: new Date().toISOString(),
          i: leResponse.aid.prefix
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
      expect(response.acdc.a.LEI).toBe("984500WORKFLOW12345");
      expect(response.anchors.tel).toBeDefined();
    });
  });
});