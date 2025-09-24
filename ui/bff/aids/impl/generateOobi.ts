import type { SignifyClient } from 'signify-ts';
import type { GenerateOOBIRequest, GenerateOOBIResponse } from '../types';
import { KeriaClient } from './KeriaClient';

/**
 * Generate an OOBI (Out-of-Band Introduction) for an AID
 * This creates a URL that can be shared with other parties to enable them
 * to discover and verify the AID's Key Event Log (KEL)
 */
export async function generateOobi(
  client: SignifyClient,
  request: GenerateOOBIRequest,
  timeoutMs: number = 2000
): Promise<GenerateOOBIResponse> {
  const startTime = Date.now();
  console.log(`🔗 [OOBI] Starting OOBI generation for alias: ${request.alias}`);
  
  if (!request.alias || request.alias.length === 0) {
    console.error(`❌ [OOBI] Invalid alias - it cannot be empty`);
    throw new Error('Invalid alias - it cannot be empty');
  }

  try {
    console.log(`🔍 [OOBI] Verifying AID exists for alias: ${request.alias}`);
    
    // First verify the AID exists
    let aids;
    try {
      const listResponse = await client.identifiers().list();
      aids = listResponse.aids || listResponse;
      console.log(`📋 [OOBI] Found ${Array.isArray(aids) ? aids.length : 0} identifiers`);
    } catch (listError: any) {
      console.error(`❌ [OOBI] Error listing identifiers: ${listError.message}`);
      throw new Error(`Failed to list identifiers: ${listError.message}`);
    }
    
    const aid = Array.isArray(aids) ? aids.find((a: any) => a.name === request.alias) : null;
    
    if (!aid) {
      const aidList = Array.isArray(aids) ? aids.map((a: any) => a.name || a.alias) : [];
      console.error(`❌ [OOBI] AID with alias ${request.alias} not found. Available AIDs: ${JSON.stringify(aidList)}`);
      throw new Error(`AID with alias ${request.alias} not found. Available AIDs: ${JSON.stringify(aidList)}`);
    }

    const prefix = aid.prefix || aid.i;
    if (!prefix) {
      console.error(`❌ [OOBI] Could not determine AID prefix for ${request.alias}`);
      throw new Error(`Could not determine AID prefix for ${request.alias}`);
    }

    console.log(`🏗️ [OOBI] Generating OOBI for AID: ${prefix} with role: ${request.role || 'witness'}`);
    
    // Generate OOBI using SignifyClient
    // The role parameter determines the type of OOBI (witness or controller)
    const result = await client.oobis().get(request.alias, request.role || 'witness');
    
    console.log(`📊 [OOBI] OOBI generation result:`, result);
    
    // Extract OOBI URL from the result
    let oobiUrl: string;
    if (result.oobis && result.oobis.length > 0) {
      oobiUrl = result.oobis[0];
    } else if (result.oobi) {
      oobiUrl = result.oobi;
    } else {
      console.error(`❌ [OOBI] No OOBI URL returned from client for ${request.alias}`);
      throw new Error(`No OOBI URL generated for AID ${request.alias}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [OOBI] Successfully generated OOBI for ${request.alias} in ${duration}ms: ${oobiUrl}`);

    return {
      oobi: oobiUrl,
      alias: request.alias,
      prefix: prefix
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [OOBI] Failed to generate OOBI for ${request.alias} after ${duration}ms: ${error.message}`);
    
    if (error instanceof Error) {
      throw new Error(`Failed to generate OOBI via KERI: ${error.message}`);
    }
    throw new Error('Failed to generate OOBI via KERI: Unknown error');
  }
}

/**
 * Generate OOBI with client wrapper
 */
export async function generateOobiWithClient(
  request: GenerateOOBIRequest,
  timeoutMs: number = 2000,
  bran?: string
): Promise<GenerateOOBIResponse> {
  console.log(`🔌 [OOBI] Creating KERIA client connection for OOBI generation`);
  try {
    const result = await KeriaClient.withClient(client => generateOobi(client, request, timeoutMs), timeoutMs, bran);
    console.log(`✅ [OOBI] Successfully completed OOBI generation via KERIA client`);
    return result;
  } catch (error: any) {
    console.error(`❌ [OOBI] KERIA client connection failed: ${error.message}`);
    throw error;
  }
}