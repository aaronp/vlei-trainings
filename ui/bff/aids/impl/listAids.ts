import type { SignifyClient } from 'signify-ts';
import type { AID, ListAIDsRequest, ListAIDsResponse } from '../types';
import { KeriaClient } from './KeriaClient';

export async function listAids(
  client: SignifyClient,
  request: ListAIDsRequest,
  timeoutMs: number = 2000
): Promise<ListAIDsResponse> {
  const startTime = Date.now();
  console.log(`🔍 [AIDS] Listing AIDs with limit: ${request.limit ?? 100}, offset: ${request.offset ?? 0}`);

  try {
    // Get all identifiers from KERI
    const listResponse = await client.identifiers().list();
    // Handle both object response and array response
    const aids = listResponse.aids || listResponse;
    
    if (!Array.isArray(aids)) {
      console.error(`❌ [AIDS] Expected array of AIDs but got: ${typeof aids}`);
      throw new Error('Invalid response from KERI identifiers list');
    }

    const totalCount = aids.length;
    console.log(`📊 [AIDS] Found ${totalCount} total AIDs`);

    // Apply pagination
    const offset = request.offset ?? 0;
    const limit = request.limit ?? 100;
    const paginatedAids = aids.slice(offset, offset + limit);

    // Transform KERI identifiers to our AID format
    const transformedAids: AID[] = paginatedAids.map((aid: any) => ({
      prefix: aid.prefix || aid.i,
      alias: aid.name || aid.alias,
      transferable: aid.transferable ?? true,
      state: {
        wits: aid.wits || [],
        icount: aid.icount || 1,
        ncount: aid.ncount || 1,
        sequence: aid.s || 0,
        digests: aid.digests || []
      }
    }));

    const duration = Date.now() - startTime;
    console.log(`✅ [AIDS] Successfully listed ${transformedAids.length} AIDs (${totalCount} total) in ${duration}ms`);

    return {
      aids: transformedAids,
      total: totalCount
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [AIDS] Failed to list AIDs after ${duration}ms: ${error.message}`);
    
    if (error instanceof Error) {
      throw new Error(`Failed to list AIDs via KERI: ${error.message}`);
    }
    throw new Error('Failed to list AIDs via KERI: Unknown error');
  }
}

export async function listAidsWithClient(
  request: ListAIDsRequest,
  timeoutMs: number = 2000,
  bran?: string
): Promise<ListAIDsResponse> {
  console.log(`🔌 [AIDS] Creating KERIA client connection for listing AIDs`);
  try {
    const result = await KeriaClient.withClient(
      client => listAids(client, request, timeoutMs),
      timeoutMs,
      bran
    );
    console.log(`✅ [AIDS] Successfully completed AID listing via KERIA client`);
    return result;
  } catch (error: any) {
    console.error(`❌ [AIDS] KERIA client connection failed: ${error.message}`);
    throw error;
  }
}