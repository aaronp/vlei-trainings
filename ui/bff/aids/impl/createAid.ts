import type { SignifyClient } from 'signify-ts';
import type { AID, CreateAIDRequest } from '../types';
import { KeriaClient } from './KeriaClient';
import { getValidatedIdentifierConfig } from '../../config/keri-template';

export async function createAid(
  client: SignifyClient, 
  request: CreateAIDRequest,
  timeoutMs: number = 2000
): Promise<AID> {
  const startTime = Date.now();
  console.log(`🔧 [AIDS] Starting AID creation for alias: ${request.alias}`);
  
  if (!request.alias || request.alias.length === 0) {
    console.error(`❌ [AIDS] Invalid AID alias - it cannot be empty`);
    throw new Error('Invalid AID alias - it cannot be empty');
  }

  try {
    // Get the template configuration
    const templateConfig = getValidatedIdentifierConfig();
    console.log(`📋 [AIDS] Using KERI template configuration:`, templateConfig);
    
    // Merge request parameters with template, with request taking precedence
    const isTransferable = request.transferable ?? templateConfig.transferable;
    // Non-transferable AIDs cannot have witnesses
    // Use template witnesses if request.wits is undefined or empty
    const wits = isTransferable ? 
      (request.wits !== undefined && request.wits.length > 0 ? request.wits : templateConfig.wits) : 
      [];
    const toad = isTransferable && wits.length > 0 ? templateConfig.toad : 0;
    const icount = request.icount ?? templateConfig.icount;
    const ncount = request.ncount ?? templateConfig.ncount;
    const isith = templateConfig.isith;
    const nsith = templateConfig.nsith;
    
    console.log(`📝 [AIDS] Final configuration - transferable: ${isTransferable}, witnesses: ${wits.length}, toad: ${toad}`);
    
    const defaultConfig = {
      transferable: isTransferable,
      wits: wits,
      toad: toad,
      count: icount,
      ncount: ncount,
      isith: isith,
      nsith: nsith
    };

    console.log(`🚀 [AIDS] Creating AID with KERI identifiers service`);
    const result = await client.identifiers().create(request.alias, defaultConfig);
    const operation = await result.op();

    console.log(`⏳ [AIDS] Waiting for AID creation operation: ${operation.name}`);
    // Wait for operation to complete
    const completedOp = await client.operations().wait(operation, { signal: AbortSignal.timeout(timeoutMs) });
    if (!completedOp.done) {
      console.error(`❌ [AIDS] AID creation operation not completed within ${timeoutMs}ms`);
      throw new Error("Creating AID is not done");
    }

    // Clean up operation
    console.log(`🧹 [AIDS] Cleaning up operation: ${operation.name}`);
    await client.operations().delete(operation.name);

    // Get the AID identifier from the operation response
    console.log(`🔍 [AIDS] Extracting AID identifier from operation response`);
    const response = completedOp.response as any;
    const aidIdentifier = response?.anchor?.i ||
      response?.i ||
      (result as any).i ||
      (result as any).prefix ||
      (result as any).pre;

    if (!aidIdentifier) {
      console.error(`❌ [AIDS] Could not determine AID identifier for ${request.alias}. Response: ${JSON.stringify(completedOp.response)}`);
      throw new Error(`Could not determine AID identifier for ${request.alias}. Operation response: ${JSON.stringify(completedOp.response)}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [AIDS] Successfully created AID ${request.alias} with prefix ${aidIdentifier} in ${duration}ms`);

    return {
      prefix: aidIdentifier,
      alias: request.alias,
      transferable: request.transferable ?? true,
      state: {
        wits: request.wits || [],
        icount: request.icount ?? 1,
        ncount: request.ncount ?? 1
      }
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // If AID already exists, retrieve it instead
    if (error.message?.includes('already incepted')) {
      console.log(`ℹ️  [AIDS] AID ${request.alias} already exists, retrieving existing AID...`);
      const aids = await client.identifiers().list();
      const existingAid = Array.isArray(aids) ? aids.find((aid: any) => aid.name === request.alias) : null;
      if (existingAid) {
        console.log(`✅ [AIDS] Retrieved existing AID ${request.alias} with prefix ${existingAid.prefix || existingAid.i} in ${duration}ms`);
        return {
          prefix: existingAid.prefix || existingAid.i,
          alias: existingAid.name,
          transferable: request.transferable ?? true,
          state: {
            wits: request.wits || [],
            icount: request.icount ?? 1,
            ncount: request.ncount ?? 1
          }
        };
      } else {
        console.error(`❌ [AIDS] AID ${request.alias} reported as existing but not found in list`);
        throw new Error(`AID ${request.alias} reported as existing but not found in list`);
      }
    }
    
    console.error(`❌ [AIDS] Failed to create AID ${request.alias} after ${duration}ms: ${error.message}`);
    
    if (error instanceof Error) {
      throw new Error(`Failed to create AID via KERI: ${error.message}`);
    }
    throw new Error('Failed to create AID via KERI: Unknown error');
  }
}

export async function createAidWithClient(request: CreateAIDRequest, timeoutMs: number = 2000, bran?: string): Promise<AID> {
  console.log(`🔌 [AIDS] Creating KERIA client connection for AID creation`);
  try {
    const result = await KeriaClient.withClient(client => createAid(client, request, timeoutMs), timeoutMs, bran);
    console.log(`✅ [AIDS] Successfully completed AID creation via KERIA client`);
    return result;
  } catch (error: any) {
    console.error(`❌ [AIDS] KERIA client connection failed: ${error.message}`);
    throw error;
  }
}