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
  const startTime = Date.now();
  console.log(`🔧 [CREDENTIALS] Starting credential issuance for issuer: ${request.issuer}, subject: ${request.subject}, schema: ${request.schemaSaid}`);
  
  // Ensure schema is loaded via our schemas service (which will resolve the OOBI)
  console.log(`📡 [CREDENTIALS] Resolving schema OOBI via schemas service for ${request.schemaSaid}...`);
  try {
    const vleiServerUrl = process.env.VLEI_SERVER_URL || 'http://localhost:7723';
    const uniqueAlias = `schema-${request.schemaSaid}-${Date.now()}`;
    const result = await client.oobis().resolve(`${vleiServerUrl}/oobi/${request.schemaSaid}`, uniqueAlias);
    
    // Wait for OOBI operation to complete if it exists
    if (result.op) {
      const operation = await result.op();
      if (!operation.done) {
        console.log(`⏳ [CREDENTIALS] Waiting for schema OOBI operation: ${operation.name}`);
        const completedOp = await client.operations().wait(operation, { signal: AbortSignal.timeout(timeoutMs) });
        if (completedOp.done) {
          await client.operations().delete(operation.name);
          console.log(`✅ [CREDENTIALS] Schema OOBI operation completed successfully`);
        } else {
          console.log(`⚠️  [CREDENTIALS] Schema OOBI operation did not complete within timeout`);
        }
      }
    }
    console.log(`✅ [CREDENTIALS] Schema OOBI resolved successfully`);
  } catch (error: any) {
    console.log(`ℹ️  [CREDENTIALS] Schema OOBI resolution failed (might already be resolved): ${error.message}`);
  }
  
  try {
    // For this MVP implementation, we'll create the issuer AID if it doesn't exist
    // This simplifies the cross-client keystore management issue
    const issuerAlias = request.issuer;
    console.log(`📝 [CREDENTIALS] Using issuer alias: ${issuerAlias}`);
    
    // Try to ensure the issuer exists - create if needed
    try {
      console.log(`🆔 [CREDENTIALS] Creating issuer AID: ${issuerAlias}`);
      await client.identifiers().create(issuerAlias, {
        transferable: true,
        wits: [],
        toad: 0,
        count: 1,
        ncount: 1,
        isith: '1',
        nsith: '1'
      });
      console.log(`✅ [CREDENTIALS] Successfully created issuer AID: ${issuerAlias}`);
    } catch (error: any) {
      // If already exists, that's fine
      if (!error.message?.includes('already incepted')) {
        console.error(`❌ [CREDENTIALS] Failed to create issuer AID: ${error.message}`);
        throw error;
      }
      console.log(`ℹ️  [CREDENTIALS] Issuer AID already exists: ${issuerAlias}`);
    }
    
    // Get or create registry for the issuer
    console.log(`📋 [CREDENTIALS] Checking registries for issuer: ${issuerAlias}`);
    let registries: any;
    try {
      registries = await client.registries().list(issuerAlias);
      console.log(`📋 [CREDENTIALS] Found ${registries.length} existing registries for issuer: ${issuerAlias}`);
    } catch (error: any) {
      // If the identifier doesn't exist in this client context, create it
      console.error(`❌ [CREDENTIALS] Failed to list registries: ${error.message}`);
      throw new Error(`Issuer AID '${issuerAlias}' not found in current SignifyClient context. Please ensure the issuer AID is created first.`);
    }
    
    let registry: any;
    
    if (registries.length === 0) {
      // Create a default registry if none exists
      const registryName = `${issuerAlias}-registry`;
      console.log(`🏗️  [CREDENTIALS] Creating new registry: ${registryName} for issuer: ${issuerAlias}`);
      
      const result = await client.registries().create({
        name: issuerAlias,  // The AID alias that owns the registry
        registryName: registryName,  // Human-readable name for the registry
        noBackers: true  // No backers for this registry
      });
      
      const operation = await result.op();
      
      // Check if operation exists and has required properties
      if (!operation || !operation.name) {
        console.error(`❌ [CREDENTIALS] Invalid operation returned from registry creation: ${JSON.stringify(operation)}`);
        throw new Error(`Invalid operation returned from registry creation: ${JSON.stringify(operation)}`);
      }
      
      console.log(`⏳ [CREDENTIALS] Waiting for registry creation operation: ${operation.name}`);
      const completedOp = await client.operations().wait(operation, { signal: AbortSignal.timeout(timeoutMs) });
      if (!completedOp.done) {
        console.error(`❌ [CREDENTIALS] Registry creation operation not completed within ${timeoutMs}ms`);
        throw new Error("Creating registry is not done");
      }
      
      console.log(`🧹 [CREDENTIALS] Cleaning up operation: ${operation.name}`);
      await client.operations().delete(operation.name);
      
      const updatedRegistries = await client.registries().list(issuerAlias);
      registry = updatedRegistries[0];
      console.log(`✅ [CREDENTIALS] Successfully created registry: ${registry?.regk || registry?.name}`);
    } else {
      registry = registries[0];
      console.log(`ℹ️  [CREDENTIALS] Using existing registry: ${registry?.regk || registry?.name}`);
    }

    if (!registry) {
      console.error(`❌ [CREDENTIALS] Could not find or create registry for issuer: ${issuerAlias}`);
      throw new Error(`Could not find or create registry for issuer ${issuerAlias}`);
    }

    // Build ACDC structure according to KERI/ACDC spec
    console.log(`🏗️  [CREDENTIALS] Building ACDC structure with registry: ${registry.regk}`);
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
      console.log(`🔗 [CREDENTIALS] Added edges to credential: ${Object.keys(request.edges).join(', ')}`);
    }

    // Issue the credential
    console.log(`🚀 [CREDENTIALS] Issuing credential from issuer: ${issuerAlias}`);
    const result = await client.credentials().issue(
      issuerAlias,  // The alias of the issuing AID
      credentialData
    );

    const operation = await result.op();

    // Check if operation exists and has required properties
    if (!operation || !operation.name) {
      console.error(`❌ [CREDENTIALS] Invalid operation returned from credential issuance: ${JSON.stringify(operation)}`);
      throw new Error(`Invalid operation returned from credential issuance: ${JSON.stringify(operation)}`);
    }

    // Wait for operation to complete
    console.log(`⏳ [CREDENTIALS] Waiting for credential issuance operation: ${operation.name}`);
    const completedOp = await client.operations().wait(operation, { signal: AbortSignal.timeout(timeoutMs) });
    if (!completedOp.done) {
      console.error(`❌ [CREDENTIALS] Credential issuance operation not completed within ${timeoutMs}ms`);
      throw new Error("Creating credential is not done");
    }

    // Clean up operation
    console.log(`🧹 [CREDENTIALS] Cleaning up credential operation: ${operation.name}`);
    await client.operations().delete(operation.name);

    // Get credential SAID from response
    const response = completedOp.response as any;
    const credentialSaid = response?.d || response?.acdc?.d || response?.anchor?.d;
    
    if (!credentialSaid) {
      console.error(`❌ [CREDENTIALS] Could not determine credential SAID from response: ${JSON.stringify(completedOp.response)}`);
      throw new Error(`Could not determine credential SAID. Operation response: ${JSON.stringify(completedOp.response)}`);
    }
    
    console.log(`🎯 [CREDENTIALS] Generated credential SAID: ${credentialSaid}`);

    // Build the full ACDC structure for response
    // Get the issuer prefix for the ACDC
    console.log(`🔍 [CREDENTIALS] Looking up issuer prefix for alias: ${issuerAlias}`);
    const identifiersResponse = await client.identifiers().list();
    const identifiers = Array.isArray(identifiersResponse) ? identifiersResponse : identifiersResponse.aids || [];
    const issuerIdentifier = identifiers.find((id: any) => id.name === issuerAlias);
    const issuerPrefix = issuerIdentifier?.prefix || issuerAlias;
    console.log(`🆔 [CREDENTIALS] Issuer prefix: ${issuerPrefix}`);

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

    const duration = Date.now() - startTime;
    console.log(`✅ [CREDENTIALS] Successfully issued credential ${credentialSaid} in ${duration}ms`);

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
    const duration = Date.now() - startTime;
    console.error(`❌ [CREDENTIALS] Failed to issue credential after ${duration}ms: ${error.message}`);
    
    if (error instanceof Error) {
      throw new Error(`Failed to issue credential via KERI: ${error.message}`);
    }
    throw new Error('Failed to issue credential via KERI: Unknown error');
  }
}

// Client wrapper function
export async function issueCredentialWithClient(request: IssueCredentialRequest, timeoutMs: number = 2000): Promise<IssueCredentialResponse> {
  console.log(`🔌 [CREDENTIALS] Creating KERIA client connection for credential issuance`);
  try {
    const result = await KeriaClient.withClient(client => issueCredential(client, request, timeoutMs), timeoutMs);
    console.log(`✅ [CREDENTIALS] Successfully completed credential issuance via KERIA client`);
    return result;
  } catch (error: any) {
    console.error(`❌ [CREDENTIALS] KERIA client connection failed: ${error.message}`);
    throw error;
  }
}