import { Elysia } from 'elysia';
import type { CreateSchemaRequest, Schema, GetSchemaRequest, ListSchemasRequest, ListSchemasResponse, ResolveSchemaOOBIRequest, ResolveSchemaOOBIResponse } from './types';
import { createSchemaWithClient, getSchemaWithClient, listSchemasWithClient, resolveSchemaOOBIWithClient } from './impl/schemaOperations';

interface SchemaRegistryStore {
  create(request: CreateSchemaRequest, timeoutMs?: number, bran?: string): Promise<Schema>;
  get(request: GetSchemaRequest, timeoutMs?: number, bran?: string): Promise<Schema | null>;
  list(request: ListSchemasRequest, timeoutMs?: number, bran?: string): Promise<ListSchemasResponse>;
  resolveOOBI(request: ResolveSchemaOOBIRequest, timeoutMs?: number, bran?: string): Promise<ResolveSchemaOOBIResponse>;
}

function makeSchemaRegistryStore(): SchemaRegistryStore {
  return {
    async create(request: CreateSchemaRequest, timeoutMs: number = 2000, bran?: string): Promise<Schema> {
      return await createSchemaWithClient(request, timeoutMs, bran);
    },
    
    async get(request: GetSchemaRequest, timeoutMs: number = 2000, bran?: string): Promise<Schema | null> {
      return await getSchemaWithClient(request, timeoutMs, bran);
    },
    
    async list(request: ListSchemasRequest, timeoutMs: number = 2000, bran?: string): Promise<ListSchemasResponse> {
      return await listSchemasWithClient(request, timeoutMs, bran);
    },
    
    async resolveOOBI(request: ResolveSchemaOOBIRequest, timeoutMs: number = 2000, bran?: string): Promise<ResolveSchemaOOBIResponse> {
      return await resolveSchemaOOBIWithClient(request, timeoutMs, bran);
    },
  };
}

export const schemaContext = new Elysia({ name: 'schemaRegistry' })
  .state('schemaRegistry', makeSchemaRegistryStore())
  .derive(({ store }) => ({
    schemaRegistry: store.schemaRegistry
  }))
  .decorate('schemaRegistry', makeSchemaRegistryStore());