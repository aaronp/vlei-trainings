import type { SignifyClient } from 'signify-ts';
import type { CreateSchemaRequest, Schema, GetSchemaRequest, ListSchemasRequest, ListSchemasResponse, ResolveSchemaOOBIRequest, ResolveSchemaOOBIResponse } from '../types';
import { KeriaClient } from '../../aids/impl/KeriaClient';
import { generateSAID, validateSchema, prepareSchemaWithSAID } from './utils';

// In-memory storage for schemas (in production, this would be a database)
const schemaStore = new Map<string, Schema>();

export async function createSchema(
  client: SignifyClient,
  request: CreateSchemaRequest,
  _timeoutMs: number = 2000
): Promise<Schema> {
  // Validate the schema
  validateSchema(request.schema);

  // Generate SAID for the schema
  const said = generateSAID(request.schema);

  // Check if schema already exists
  if (schemaStore.has(said)) {
    return schemaStore.get(said)!;
  }

  // Prepare schema with SAID embedded
  const schemaWithSAID = prepareSchemaWithSAID(request.schema);

  try {
    // Check if schema already exists in KERIA
    try {
      const existingSchema = await client.schemas().get(said);
      if (existingSchema) {
        console.log(`Schema ${said} already exists in KERIA`);
      }
    } catch (checkError: any) {
      // Schema doesn't exist in KERIA yet, which is expected for new schemas
      if (checkError.message?.includes('404') || checkError.message?.includes('Not Found')) {
        console.log(`Schema ${said} not yet in KERIA (this is expected for new schemas)`);
      } else {
        console.warn(`Error checking schema in KERIA: ${checkError.message}`);
      }
    }

    // Create the schema object
    const schema: Schema = {
      said,
      schema: schemaWithSAID,
      description: request.description,
      createdAt: new Date().toISOString()
    };

    // Store the schema locally as well
    schemaStore.set(said, schema);

    return schema;
  } catch (error: any) {
    if (error instanceof Error) {
      throw new Error(`Failed to create schema: ${error.message}`);
    }
    throw new Error('Failed to create schema: Unknown error');
  }
}

export async function getSchema(
  client: SignifyClient,
  request: GetSchemaRequest,
  _timeoutMs: number = 2000
): Promise<Schema | null> {
  const schema = schemaStore.get(request.said);

  if (!schema) {
    // Try to fetch from KERIA if available
    try {
      const keriaSchema = await client.schemas().get(request.said);
      if (keriaSchema) {
        const schema: Schema = {
          said: request.said,
          schema: keriaSchema,
          description: undefined,
          createdAt: new Date().toISOString()
        };
        return schema;
      }
    } catch (error) {
      // Schema not found in KERIA either
      console.log(`Schema ${request.said} not found in KERIA`);
    }
    return null;
  }

  return schema;
}

export async function listSchemas(
  _client: SignifyClient,
  request: ListSchemasRequest,
  _timeoutMs: number = 2000
): Promise<ListSchemasResponse> {
  const limit = request.limit || 10;
  const offset = request.offset || 0;

  // Get all schemas from the store
  const allSchemas = Array.from(schemaStore.values());

  // Apply pagination
  const paginatedSchemas = allSchemas.slice(offset, offset + limit);

  return {
    schemas: paginatedSchemas,
    total: allSchemas.length,
    limit,
    offset
  };
}

// Wrapper functions that use KeriaClient
export async function createSchemaWithClient(
  request: CreateSchemaRequest,
  timeoutMs: number = 2000
): Promise<Schema> {
  return KeriaClient.withClient(client => createSchema(client, request, timeoutMs), timeoutMs);
}

export async function getSchemaWithClient(
  request: GetSchemaRequest,
  timeoutMs: number = 2000
): Promise<Schema | null> {
  return KeriaClient.withClient(client => getSchema(client, request, timeoutMs), timeoutMs);
}

export async function listSchemasWithClient(
  request: ListSchemasRequest,
  timeoutMs: number = 2000
): Promise<ListSchemasResponse> {
  return KeriaClient.withClient(client => listSchemas(client, request, timeoutMs), timeoutMs);
}

export async function resolveSchemaOOBI(
  client: SignifyClient,
  request: ResolveSchemaOOBIRequest,
  timeoutMs: number = 2000
): Promise<ResolveSchemaOOBIResponse> {
  const startTime = Date.now();
  console.log(`📡 [SCHEMAS] Resolving schema OOBI for ${request.schemaSaid}...`);

  try {
    const vleiServerUrl = process.env.VLEI_SERVER_URL || 'http://localhost:7723';
    const uniqueAlias = `schema-${request.schemaSaid}-${Date.now()}`;
    const result = await client.oobis().resolve(`${vleiServerUrl}/oobi/${request.schemaSaid}`, uniqueAlias);
    
    // Wait for OOBI operation to complete if it exists
    if (result.op) {
      const operation = await result.op();
      if (!operation.done) {
        console.log(`⏳ [SCHEMAS] Waiting for schema OOBI operation: ${operation.name}`);
        const completedOp = await client.operations().wait(operation, { signal: AbortSignal.timeout(timeoutMs) });
        if (completedOp.done) {
          await client.operations().delete(operation.name);
          console.log(`✅ [SCHEMAS] Schema OOBI operation completed successfully`);
        } else {
          console.log(`⚠️  [SCHEMAS] Schema OOBI operation did not complete within timeout`);
          return {
            success: false,
            message: `Schema OOBI operation did not complete within ${timeoutMs}ms`
          };
        }
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ [SCHEMAS] Schema OOBI resolved successfully in ${duration}ms`);
    
    return {
      success: true,
      message: `Schema OOBI resolved successfully for ${request.schemaSaid}`
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`ℹ️  [SCHEMAS] Schema OOBI resolution failed after ${duration}ms (might already be resolved): ${error.message}`);
    
    return {
      success: false,
      message: `Failed to resolve schema OOBI: ${error.message}`
    };
  }
}

export async function resolveSchemaOOBIWithClient(
  request: ResolveSchemaOOBIRequest,
  timeoutMs: number = 2000
): Promise<ResolveSchemaOOBIResponse> {
  return KeriaClient.withClient(client => resolveSchemaOOBI(client, request, timeoutMs), timeoutMs);
}