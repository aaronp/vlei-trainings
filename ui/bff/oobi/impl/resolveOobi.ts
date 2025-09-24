import type { SignifyClient } from 'signify-ts';
import type { ResolveOOBIRequest, ResolveOOBIResponse, OOBIOperation } from '../types';
import { KeriaClient } from '../../aids/impl/KeriaClient';

export async function resolveOobi(
  client: SignifyClient,
  request: ResolveOOBIRequest,
  timeoutMs: number = 2000
): Promise<ResolveOOBIResponse> {
  if (!request.oobi || request.oobi.length === 0) {
    throw new Error('Invalid OOBI - it cannot be empty');
  }

  if (!request.alias || request.alias.length === 0) {
    throw new Error('Invalid alias - it cannot be empty');
  }

  try {
    // Generate a unique alias to avoid conflicts
    const uniqueAlias = `${request.alias}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    const result = await client.oobis().resolve(request.oobi, uniqueAlias);
    
    let operation: OOBIOperation;
    if (typeof result.op === 'function') {
      const op = await result.op();
      operation = {
        name: op.name,
        done: op.done,
        response: op.response
      };
    } else {
      operation = {
        name: (result as any).name || 'oobi-resolve',
        done: true,
        response: result
      };
    }

    // Wait for operation to complete if not already done
    if (!operation.done) {
      try {
        const completedOp = await client.operations().wait(
          { name: operation.name, done: operation.done },
          { signal: AbortSignal.timeout(timeoutMs) }
        );
        
        operation.done = completedOp.done || false;
        operation.response = completedOp.response;

        // Clean up operation
        await client.operations().delete(operation.name);
      } catch (waitError: any) {
        console.warn(`OOBI operation wait timed out after ${timeoutMs}ms: ${waitError.message}`);
        
        // Try to clean up the hanging operation
        await client.operations().delete(operation.name).catch(err =>
          console.warn(`Failed to cleanup hanging OOBI operation:`, err)
        );
      }
    }

    return {
      operation,
      success: true
    };
  } catch (error: any) {
    if (error instanceof Error) {
      throw new Error(`Failed to resolve OOBI via KERI: ${error.message}`);
    }
    throw new Error('Failed to resolve OOBI via KERI: Unknown error');
  }
}

export async function resolveOobiWithClient(
  request: ResolveOOBIRequest,
  timeoutMs: number = 2000,
  bran?: string
): Promise<ResolveOOBIResponse> {
  return KeriaClient.withClient(client => resolveOobi(client, request, timeoutMs), timeoutMs, bran);
}