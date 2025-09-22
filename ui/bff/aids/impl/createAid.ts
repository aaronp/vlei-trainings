import type { SignifyClient } from 'signify-ts';
import type { AID, CreateAIDRequest } from '../types';
import { KeriaClient } from './KeriaClient';

export async function createAid(
  client: SignifyClient, 
  request: CreateAIDRequest
): Promise<AID> {
  if (!request.alias || request.alias.length === 0) {
    throw new Error('Invalid AID alias - it cannot be empty');
  }

  try {
    await client.identifiers().create(request.alias, {
      transferable: request.transferable ?? true,
      wits: request.wits || [],
      toad: request.wits?.length || 0,
      count: request.icount ?? 1,
      ncount: request.ncount ?? 1,
      isith: '1',
      nsith: '1'
    });
    
    const aid = await client.identifiers().get(request.alias);
    
    return {
      prefix: aid.prefix,
      alias: aid.name,
      transferable: request.transferable ?? true,
      state: {
        wits: request.wits || [],
        icount: request.icount ?? 1,
        ncount: request.ncount ?? 1,
        ...aid.state
      }
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create AID via KERI: ${error.message}`);
    }
    throw new Error('Failed to create AID via KERI: Unknown error');
  }
}

export async function createAidWithClient(request: CreateAIDRequest): Promise<AID> {
  return KeriaClient.withClient(client => createAid(client, request));
}