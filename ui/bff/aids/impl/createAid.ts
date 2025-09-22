import type { SignifyClient } from 'signify-ts';
import type { AID, CreateAIDRequest } from '../types';
import { KeriaClient } from './KeriaClient';

export async function createAid(
  client: SignifyClient, 
  request: CreateAIDRequest,
  timeoutMs: number = 2000
): Promise<AID> {
  if (!request.alias || request.alias.length === 0) {
    throw new Error('Invalid AID alias - it cannot be empty');
  }

  try {
    // Try to create new AID
    const isTransferable = request.transferable ?? true;
    const wits = request.wits || [];
    
    const defaultConfig = {
      transferable: isTransferable,
      wits: isTransferable ? wits : [],
      toad: isTransferable ? wits.length : 0,
      count: isTransferable ? (request.icount ?? 1) : 1,
      ncount: isTransferable ? (request.ncount ?? 1) : 1,
      isith: '1',
      nsith: '1'
    };

    const result = await client.identifiers().create(request.alias, defaultConfig);
    const operation = await result.op();

    // Wait for operation to complete
    const completedOp = await client.operations().wait(operation, { signal: AbortSignal.timeout(timeoutMs) });
    if (!completedOp.done) {
      throw new Error("Creating AID is not done");
    }

    // Clean up operation
    await client.operations().delete(operation.name);

    // Get the AID identifier from the operation response
    const response = completedOp.response as any;
    const aidIdentifier = response?.anchor?.i ||
      response?.i ||
      (result as any).i ||
      (result as any).prefix ||
      (result as any).pre;

    if (!aidIdentifier) {
      throw new Error(`Could not determine AID identifier for ${request.alias}. Operation response: ${JSON.stringify(completedOp.response)}`);
    }

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
    // If AID already exists, retrieve it instead
    if (error.message?.includes('already incepted')) {
      console.log(`AID ${request.alias} already exists, retrieving existing AID...`);
      const aids = await client.identifiers().list();
      const existingAid = Array.isArray(aids) ? aids.find((aid: any) => aid.name === request.alias) : null;
      if (existingAid) {
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
        throw new Error(`AID ${request.alias} reported as existing but not found in list`);
      }
    }
    
    if (error instanceof Error) {
      throw new Error(`Failed to create AID via KERI: ${error.message}`);
    }
    throw new Error('Failed to create AID via KERI: Unknown error');
  }
}

export async function createAidWithClient(request: CreateAIDRequest, timeoutMs: number = 2000): Promise<AID> {
  return KeriaClient.withClient(client => createAid(client, request, timeoutMs), timeoutMs);
}