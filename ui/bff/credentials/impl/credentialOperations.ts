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
    // Get or create registry for the issuer
    const registries = await client.registries().list(request.issuer);
    let registry: any;
    
    if (registries.length === 0) {
      // Create a default registry if none exists
      const registryName = `${request.issuer}-registry`;
      const result = await client.registries().create({
        name: registryName,
        alias: request.issuer,
        estOnly: true,
        backers: []
      });
      
      const operation = await result.op();
      const completedOp = await client.operations().wait(operation, { signal: AbortSignal.timeout(timeoutMs) });
      if (!completedOp.done) {
        throw new Error("Creating registry is not done");
      }
      await client.operations().delete(operation.name);
      
      const updatedRegistries = await client.registries().list(request.issuer);
      registry = updatedRegistries[0];
    } else {
      registry = registries[0];
    }

    if (!registry) {
      throw new Error(`Could not find or create registry for issuer ${request.issuer}`);
    }

    // Build ACDC structure according to KERI/ACDC spec
    const credentialData = {
      v: "ACDC10JSON000000_",
      d: "",  // Will be filled by SAIDification
      u: "",  // Optional nonce
      i: request.issuer,
      rd: registry.regk,  // Registry SAID
      s: request.schemaSaid,
      a: {
        d: "",  // Will be filled by SAIDification
        i: request.subject,
        dt: new Date().toISOString(),
        ...request.claims
      }
    };

    // Add edges if provided
    if (request.edges) {
      (credentialData as any).e = request.edges;
    }

    // Create the credential
    const result = await client.credentials().create(
      request.issuer,
      registry.name,
      credentialData
    );

    const operation = await result.op();

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

    // Get the full ACDC data
    const credentials = await client.credentials().list(request.issuer);
    const issuedCredential = credentials.find((c: any) => c.sad?.d === credentialSaid);
    
    if (!issuedCredential) {
      throw new Error(`Could not find issued credential with SAID ${credentialSaid}`);
    }

    // Build response according to spec
    return {
      id: credentialSaid,
      jwt: undefined, // Optional - could implement JWS encoding later
      acdc: issuedCredential.sad || credentialData,
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