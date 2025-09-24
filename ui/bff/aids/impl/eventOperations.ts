import type { SignifyClient } from 'signify-ts';
import type { EventsRequest, EventsResponse, AIDEvent } from '../types';
import { KeriaClient } from './KeriaClient';

/**
 * List events for an AID by retrieving its Key Event Log (KEL)
 */
export async function listAIDEvents(
  client: SignifyClient,
  request: EventsRequest,
  timeoutMs: number = 2000
): Promise<EventsResponse> {
  const startTime = Date.now();
  console.log(`📋 [EVENTS] Starting event listing for alias: ${request.alias}`);
  
  if (!request.alias || request.alias.length === 0) {
    console.error(`❌ [EVENTS] Invalid alias - it cannot be empty`);
    throw new Error('Invalid alias - it cannot be empty');
  }

  try {
    console.log(`🔍 [EVENTS] Retrieving AID information for alias: ${request.alias}`);
    
    // Get the AID to ensure it exists and get its prefix
    let aids;
    try {
      const listResponse = await client.identifiers().list();
      // Handle both object response and array response
      aids = listResponse.aids || listResponse;
      console.log(`📋 [EVENTS] List response type: ${typeof listResponse}, has aids property: ${!!listResponse.aids}`);
    } catch (listError: any) {
      console.error(`❌ [EVENTS] Error listing identifiers: ${listError.message}`);
      throw new Error(`Failed to list identifiers: ${listError.message}`);
    }
    
    console.log(`📋 [EVENTS] Found ${Array.isArray(aids) ? aids.length : 0} identifiers`);
    const aid = Array.isArray(aids) ? aids.find((a: any) => a.name === request.alias) : null;
    
    if (!aid) {
      const aidList = Array.isArray(aids) ? aids.map((a: any) => a.name || a.alias) : [];
      console.error(`❌ [EVENTS] AID with alias ${request.alias} not found. Available AIDs: ${JSON.stringify(aidList)}`);
      throw new Error(`AID with alias ${request.alias} not found. Available AIDs: ${JSON.stringify(aidList)}`);
    }

    const prefix = aid.prefix || aid.i;
    if (!prefix) {
      console.error(`❌ [EVENTS] Could not determine AID prefix for ${request.alias}`);
      throw new Error(`Could not determine AID prefix for ${request.alias}`);
    }

    console.log(`📜 [EVENTS] Retrieving Key Event Log for AID: ${prefix}`);
    
    // Get the Key Event Log (KEL) for the AID
    // In signify-ts, we can get events through the identifiers().get() method
    // which should include the event log information
    const aidDetails = await client.identifiers().get(request.alias);
    console.log(`📊 [EVENTS] Retrieved AID details:`, aidDetails);

    // Parse events from the AID details
    let events: AIDEvent[] = [];
    let totalEvents = 0;

    // Check if aidDetails contains event information
    if (aidDetails && typeof aidDetails === 'object') {
      // The event structure may vary depending on signify-ts version
      // Try to extract events from various possible locations
      const eventData = (aidDetails as any).events || 
                       (aidDetails as any).kel || 
                       (aidDetails as any).log ||
                       [];

      if (Array.isArray(eventData)) {
        totalEvents = eventData.length;
        
        // Apply pagination
        const offset = request.offset || 0;
        const limit = request.limit || 100;
        const paginatedEvents = eventData.slice(offset, offset + limit);
        
        events = paginatedEvents.map((event: any, index: number) => ({
          sequence: event.s || event.sequence || (offset + index),
          eventType: event.t || event.type || 'unknown',
          digest: event.d || event.digest || event.said || 'unknown',
          timestamp: event.dt || event.timestamp || new Date().toISOString(),
          data: event,
          signatures: event.sigs || event.signatures || []
        }));
        
        console.log(`📋 [EVENTS] Processed ${events.length} events (${offset}-${offset + events.length} of ${totalEvents})`);
      } else {
        // If no events array found, create a basic entry from the AID state
        console.log(`ℹ️  [EVENTS] No event log found, creating summary from AID state`);
        events = [{
          sequence: (aidDetails as any).s || 0,
          eventType: 'icp', // inception event
          digest: (aidDetails as any).d || prefix,
          timestamp: new Date().toISOString(),
          data: aidDetails,
          signatures: []
        }];
        totalEvents = 1;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [EVENTS] Successfully retrieved ${events.length} events for ${request.alias} in ${duration}ms`);

    return {
      alias: request.alias,
      prefix: prefix,
      events: events,
      total: totalEvents
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [EVENTS] Failed to retrieve events for ${request.alias} after ${duration}ms: ${error.message}`);
    
    if (error instanceof Error) {
      throw new Error(`Failed to retrieve AID events via KERI: ${error.message}`);
    }
    throw new Error('Failed to retrieve AID events via KERI: Unknown error');
  }
}

/**
 * List AID events with client wrapper
 */
export async function listAIDEventsWithClient(request: EventsRequest, timeoutMs: number = 2000, bran?: string): Promise<EventsResponse> {
  console.log(`🔌 [EVENTS] Creating KERIA client connection for event listing`);
  try {
    const result = await KeriaClient.withClient(client => listAIDEvents(client, request, timeoutMs), timeoutMs, bran);
    console.log(`✅ [EVENTS] Successfully completed event listing via KERIA client`);
    return result;
  } catch (error: any) {
    console.error(`❌ [EVENTS] KERIA client connection failed: ${error.message}`);
    throw error;
  }
}