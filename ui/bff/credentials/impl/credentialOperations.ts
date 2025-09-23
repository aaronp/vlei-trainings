import type { SignifyClient } from 'signify-ts';
import type { 
  IssueCredentialRequest,
  IssueCredentialResponse
} from '../types';
import { KeriaClient } from '../../aids/impl/KeriaClient';

export async function issueCredential(
  client: SignifyClient,
  request: IssueCredentialRequest,
  timeoutMs: number = 2000
): Promise<IssueCredentialResponse> {
  try {
    // For this MVP implementation, we'll create the issuer AID if it doesn't exist
    // This simplifies the cross-client keystore management issue
    const issuerAlias = request.issuer;
    
    // Try to ensure the issuer exists - create if needed
    try {
      await client.identifiers().create(issuerAlias, {
        transferable: true,
        wits: [],
        toad: 0,
        count: 1,
        ncount: 1,
        isith: '1',
        nsith: '1'
      });
    } catch (error: any) {
      // If already exists, that's fine
      if (!error.message?.includes('already incepted')) {
        throw error;
      }
    }
    
    // Get or create registry for the issuer
    let registries;
    try {
      registries = await client.registries().list(issuerAlias);
    } catch (error: any) {
      // If the identifier doesn't exist in this client context, create it
      throw new Error(`Issuer AID '${issuerAlias}' not found in current SignifyClient context. Please ensure the issuer AID is created first.`);
    }
    
    let registry: any;
    
    if (registries.length === 0) {
      // Create a default registry if none exists
      const registryName = `${issuerAlias}-registry`;
      const result = await client.registries().create({
        name: issuerAlias,  // The AID alias that owns the registry
        registryName: registryName,  // Human-readable name for the registry
        noBackers: true  // No backers for this registry
      });
      
      const operation = result.op;
      
      // Check if operation exists and has required properties
      if (!operation || !operation.name) {
        throw new Error(`Invalid operation returned from registry creation: ${JSON.stringify(operation)}`);
      }
      
      const completedOp = await client.operations().wait(operation, { signal: AbortSignal.timeout(timeoutMs) });
      if (!completedOp.done) {
        throw new Error("Creating registry is not done");
      }
      await client.operations().delete(operation.name);
      
      const updatedRegistries = await client.registries().list(issuerAlias);
      registry = updatedRegistries[0];
    } else {
      registry = registries[0];
    }

    if (!registry) {
      throw new Error(`Could not find or create registry for issuer ${issuerAlias}`);
    }

    // Build ACDC structure according to KERI/ACDC spec
    const credentialData: any = {
      ri: registry.regk,  // Registry identifier (required)
      s: request.schemaSaid,  // Schema SAID (required)
      a: {
        i: request.subject,
        dt: new Date().toISOString(),
        ...request.claims
      }
    };

    // Add edges if provided
    if (request.edges) {
      credentialData.e = request.edges;
    }

    // Issue the credential
    const result = await client.credentials().issue(
      issuerAlias,  // The alias of the issuing AID
      credentialData
    );

    const operation = result.op;

    // Check if operation exists and has required properties
    if (!operation || !operation.name) {
      throw new Error(`Invalid operation returned from credential issuance: ${JSON.stringify(operation)}`);
    }

    // Wait for operation to complete
    const completedOp = await client.operations().wait(operation, { signal: AbortSignal.timeout(timeoutMs) });
    if (!completedOp.done) {
      throw new Error("Creating credential is not done");
    }

    // Clean up operation
    await client.operations().delete(operation.name);

    // Get credential SAID from response
    const response = completedOp.response as any;
    const credentialSaid = response?.d || response?.acdc?.d || response?.anchor?.d;
    
    if (!credentialSaid) {
      throw new Error(`Could not determine credential SAID. Operation response: ${JSON.stringify(completedOp.response)}`);
    }

    // Build the full ACDC structure for response
    // Get the issuer prefix for the ACDC
    const identifiersResponse = await client.identifiers().list();
    const identifiers = Array.isArray(identifiersResponse) ? identifiersResponse : identifiersResponse.aids || [];
    const issuerIdentifier = identifiers.find((id: any) => id.name === issuerAlias);
    const issuerPrefix = issuerIdentifier?.prefix || issuerAlias;

    const acdcData = {
      v: "ACDC10JSON000000_",
      d: credentialSaid,
      i: issuerPrefix,  // Use the actual AID prefix for the issuer
      ri: registry.regk,
      s: request.schemaSaid,
      a: {
        d: "",  // Would be filled by SAIDification
        i: request.subject,
        dt: new Date().toISOString(),
        ...request.claims
      }
    };

    // Add edges if they exist
    if (request.edges) {
      (acdcData as any).e = request.edges;
    }

    // Build response according to spec
    return {
      id: credentialSaid,
      jwt: undefined, // Optional - could implement JWS encoding later
      acdc: acdcData,
      anchors: {
        kel: `sn: ${response?.sn || 'unknown'}`,
        tel: registry.regk
      }
    };
  } catch (error: any) {
    if (error instanceof Error) {
      throw new Error(`Failed to issue credential via KERI: ${error.message}`);
    }
    throw new Error('Failed to issue credential via KERI: Unknown error');
  }
}

// Client wrapper function
export async function issueCredentialWithClient(request: IssueCredentialRequest, timeoutMs: number = 2000): Promise<IssueCredentialResponse> {
  return KeriaClient.withClient(client => issueCredential(client, request, timeoutMs), timeoutMs);
}