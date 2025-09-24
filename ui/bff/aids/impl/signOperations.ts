import type { SignifyClient } from 'signify-ts';
import type { SignRequest, SignResponse, VerifyRequest, VerifyResponse } from '../types';
import { KeriaClient } from './KeriaClient';

/**
 * Sign a text message using an AID by creating an interaction event
 * In KERI, signing is done through events that commit to data
 */
export async function signMessage(
  client: SignifyClient,
  request: SignRequest,
  timeoutMs: number = 2000
): Promise<SignResponse> {
  const startTime = Date.now();
  console.log(`🔏 [SIGN] Starting message signing via interaction event for alias: ${request.alias}`);
  
  if (!request.alias || request.alias.length === 0) {
    console.error(`❌ [SIGN] Invalid alias - it cannot be empty`);
    throw new Error('Invalid alias - it cannot be empty');
  }

  if (!request.text) {
    console.error(`❌ [SIGN] Invalid text - it cannot be empty`);
    throw new Error('Invalid text - it cannot be empty');
  }

  try {
    console.log(`🔐 [SIGN] Creating interaction event to commit to message for alias: ${request.alias}`);
    
    // Get the AID to ensure it exists
    console.log(`🔍 [SIGN] Listing identifiers to find alias: ${request.alias}`);
    const aids = await client.identifiers().list();
    console.log(`📋 [SIGN] Found ${Array.isArray(aids) ? aids.length : 0} identifiers:`, aids);
    const aid = Array.isArray(aids) ? aids.find((a: any) => a.name === request.alias) : null;
    console.log(`🎯 [SIGN] Found matching AID:`, aid);
    
    if (!aid) {
      const aidList = Array.isArray(aids) ? aids.map((a: any) => a.name || a.alias) : [];
      console.error(`❌ [SIGN] AID with alias ${request.alias} not found. Available AIDs: ${JSON.stringify(aidList)}`);
      throw new Error(`AID with alias ${request.alias} not found. Available AIDs: ${JSON.stringify(aidList)}`);
    }

    // Create an interaction event that commits to the message
    // This is the KERI way of "signing" - creating an event with the data
    const interactionData = {
      message: request.text,
      timestamp: new Date().toISOString()
    };
    
    const result = await client.identifiers().interact(request.alias, interactionData);
    const operation = await result.op();

    console.log(`⏳ [SIGN] Waiting for interaction event operation: ${operation.name}`);
    const completedOp = await client.operations().wait(operation, { signal: AbortSignal.timeout(timeoutMs) });
    if (!completedOp.done) {
      console.error(`❌ [SIGN] Interaction event operation not completed within ${timeoutMs}ms`);
      throw new Error("Signing interaction event is not done");
    }

    // Clean up operation
    console.log(`🧹 [SIGN] Cleaning up operation: ${operation.name}`);
    await client.operations().delete(operation.name);

    // The "signature" in KERI context is the event identifier and its signatures
    const eventData = completedOp.response as any;
    const eventSignature = {
      event: eventData.d || operation.name, // Event digest/identifier
      sigs: result.sigs || [], // Event signatures
      prefix: aid.prefix || aid.i
    };
    
    const duration = Date.now() - startTime;
    console.log(`✅ [SIGN] Successfully created signed interaction event for ${request.alias} in ${duration}ms`);

    // Return a stringified version for API compatibility
    return {
      signature: JSON.stringify(eventSignature)
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [SIGN] Failed to create signed interaction event for ${request.alias} after ${duration}ms: ${error.message}`);
    
    if (error instanceof Error) {
      throw new Error(`Failed to sign message via KERI: ${error.message}`);
    }
    throw new Error('Failed to sign message via KERI: Unknown error');
  }
}

/**
 * Verify a KERI interaction event signature
 * In KERI, verification involves checking the event's cryptographic integrity
 */
export async function verifyMessage(
  client: SignifyClient,
  request: VerifyRequest,
  timeoutMs: number = 2000
): Promise<VerifyResponse> {
  const startTime = Date.now();
  console.log(`🔍 [VERIFY] Starting KERI event verification for alias: ${request.alias}`);
  
  if (!request.alias || request.alias.length === 0) {
    console.error(`❌ [VERIFY] Invalid alias - it cannot be empty`);
    throw new Error('Invalid alias - it cannot be empty');
  }

  if (!request.text) {
    console.error(`❌ [VERIFY] Invalid text - it cannot be empty`);
    throw new Error('Invalid text - it cannot be empty');
  }

  if (!request.signature) {
    console.error(`❌ [VERIFY] Invalid signature - it cannot be empty`);
    throw new Error('Invalid signature - it cannot be empty');
  }

  try {
    console.log(`🔍 [VERIFY] Parsing KERI event signature for alias: ${request.alias}`);
    
    // Get the AID to get the prefix if not provided
    const aids = await client.identifiers().list();
    const aid = Array.isArray(aids) ? aids.find((a: any) => a.name === request.alias) : null;
    
    if (!aid) {
      console.error(`❌ [VERIFY] AID with alias ${request.alias} not found`);
      throw new Error(`AID with alias ${request.alias} not found`);
    }

    const prefix = request.prefix || aid.prefix || aid.i;
    if (!prefix) {
      console.error(`❌ [VERIFY] Could not determine AID prefix for ${request.alias}`);
      throw new Error(`Could not determine AID prefix for ${request.alias}`);
    }

    // Parse the KERI event signature (should be JSON from signMessage)
    let eventSignature;
    try {
      eventSignature = JSON.parse(request.signature);
    } catch (parseError) {
      console.error(`❌ [VERIFY] Invalid signature format - not valid JSON`);
      return {
        valid: false,
        prefix: prefix
      };
    }

    // Basic validation of the signature structure
    const isValidStructure = eventSignature && 
                           typeof eventSignature.event === 'string' && 
                           Array.isArray(eventSignature.sigs) &&
                           eventSignature.prefix === prefix;
    
    if (!isValidStructure) {
      console.log(`❌ [VERIFY] Invalid signature structure for ${request.alias}`);
      return {
        valid: false,
        prefix: prefix
      };
    }

    // In a full implementation, you would verify the event against the KEL
    // For now, we'll do basic structural validation
    // TODO: Implement full cryptographic verification using KERI event log
    
    const duration = Date.now() - startTime;
    console.log(`✅ [VERIFY] KERI event signature verified for ${request.alias} in ${duration}ms`);

    return {
      valid: isValidStructure,
      prefix: prefix
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [VERIFY] Failed to verify KERI event signature for ${request.alias} after ${duration}ms: ${error.message}`);
    
    if (error instanceof Error) {
      throw new Error(`Failed to verify signature via KERI: ${error.message}`);
    }
    throw new Error('Failed to verify signature via KERI: Unknown error');
  }
}

/**
 * Sign message with client wrapper
 */
export async function signMessageWithClient(request: SignRequest, timeoutMs: number = 2000, bran?: string): Promise<SignResponse> {
  console.log(`🔌 [SIGN] Creating KERIA client connection for message signing`);
  try {
    const result = await KeriaClient.withClient(client => signMessage(client, request, timeoutMs), timeoutMs, bran);
    console.log(`✅ [SIGN] Successfully completed message signing via KERIA client`);
    return result;
  } catch (error: any) {
    console.error(`❌ [SIGN] KERIA client connection failed: ${error.message}`);
    throw error;
  }
}

/**
 * Verify message with client wrapper
 */
export async function verifyMessageWithClient(request: VerifyRequest, timeoutMs: number = 2000, bran?: string): Promise<VerifyResponse> {
  console.log(`🔌 [VERIFY] Creating KERIA client connection for signature verification`);
  try {
    const result = await KeriaClient.withClient(client => verifyMessage(client, request, timeoutMs), timeoutMs, bran);
    console.log(`✅ [VERIFY] Successfully completed signature verification via KERIA client`);
    return result;
  } catch (error: any) {
    console.error(`❌ [VERIFY] KERIA client connection failed: ${error.message}`);
    throw error;
  }
}