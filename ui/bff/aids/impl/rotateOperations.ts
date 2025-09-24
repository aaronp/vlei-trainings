import type { SignifyClient } from 'signify-ts';
import type { RotateRequest, RotateResponse } from '../types';
import { KeriaClient } from './KeriaClient';

/**
 * Rotate the keys for an AID
 */
export async function rotateKeys(
  client: SignifyClient,
  request: RotateRequest,
  timeoutMs: number = 2000
): Promise<RotateResponse> {
  const startTime = Date.now();
  console.log(`🔄 [ROTATE] Starting key rotation for alias: ${request.alias}`);
  
  if (!request.alias || request.alias.length === 0) {
    console.error(`❌ [ROTATE] Invalid alias - it cannot be empty`);
    throw new Error('Invalid alias - it cannot be empty');
  }

  try {
    console.log(`🔄 [ROTATE] Performing key rotation for alias: ${request.alias}`);
    
    // Get the current AID to ensure it exists and is transferable
    const aids = await client.identifiers().list();
    const aid = Array.isArray(aids) ? aids.find((a: any) => a.name === request.alias) : null;
    
    if (!aid) {
      console.error(`❌ [ROTATE] AID with alias ${request.alias} not found`);
      throw new Error(`AID with alias ${request.alias} not found`);
    }

    const prefix = aid.prefix || aid.i;
    if (!prefix) {
      console.error(`❌ [ROTATE] Could not determine AID prefix for ${request.alias}`);
      throw new Error(`Could not determine AID prefix for ${request.alias}`);
    }

    // Prepare rotation configuration
    const rotationConfig: any = {};
    
    if (request.count !== undefined) rotationConfig.count = request.count;
    if (request.ncount !== undefined) rotationConfig.ncount = request.ncount;
    if (request.wits) rotationConfig.wits = request.wits;
    if (request.cuts) rotationConfig.cuts = request.cuts;
    if (request.adds) rotationConfig.adds = request.adds;

    console.log(`🚀 [ROTATE] Executing rotation with config:`, rotationConfig);
    
    // Perform the rotation
    const result = await client.identifiers().rotate(request.alias, rotationConfig);
    const operation = await result.op();

    console.log(`⏳ [ROTATE] Waiting for rotation operation: ${operation.name}`);
    
    // Wait for operation to complete
    const completedOp = await client.operations().wait(operation, { signal: AbortSignal.timeout(timeoutMs) });
    if (!completedOp.done) {
      console.error(`❌ [ROTATE] Key rotation operation not completed within ${timeoutMs}ms`);
      throw new Error("Key rotation is not done");
    }

    // Clean up operation
    console.log(`🧹 [ROTATE] Cleaning up operation: ${operation.name}`);
    await client.operations().delete(operation.name);

    // Get the updated AID information
    console.log(`🔍 [ROTATE] Retrieving updated AID information`);
    const updatedAids = await client.identifiers().list();
    const updatedAid = Array.isArray(updatedAids) ? updatedAids.find((a: any) => a.name === request.alias) : null;
    
    if (!updatedAid) {
      console.error(`❌ [ROTATE] Could not retrieve updated AID after rotation`);
      throw new Error(`Could not retrieve updated AID after rotation`);
    }

    // Extract sequence number and public key from the rotation response
    const response = completedOp.response as any;
    const sequence = response?.s || updatedAid.s || 0;
    const publicKey = (updatedAid.k && updatedAid.k[0]) || updatedAid.publicKey || 'unknown';

    const duration = Date.now() - startTime;
    console.log(`✅ [ROTATE] Successfully rotated keys for ${request.alias} - New sequence: ${sequence} in ${duration}ms`);

    return {
      prefix: prefix,
      alias: request.alias,
      sequence: parseInt(sequence, 10),
      publicKey: publicKey
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [ROTATE] Failed to rotate keys for ${request.alias} after ${duration}ms: ${error.message}`);
    
    if (error instanceof Error) {
      throw new Error(`Failed to rotate keys via KERI: ${error.message}`);
    }
    throw new Error('Failed to rotate keys via KERI: Unknown error');
  }
}

/**
 * Rotate keys with client wrapper
 */
export async function rotateKeysWithClient(request: RotateRequest, timeoutMs: number = 2000, bran?: string): Promise<RotateResponse> {
  console.log(`🔌 [ROTATE] Creating KERIA client connection for key rotation`);
  try {
    const result = await KeriaClient.withClient(client => rotateKeys(client, request, timeoutMs), timeoutMs, bran);
    console.log(`✅ [ROTATE] Successfully completed key rotation via KERIA client`);
    return result;
  } catch (error: any) {
    console.error(`❌ [ROTATE] KERIA client connection failed: ${error.message}`);
    throw error;
  }
}