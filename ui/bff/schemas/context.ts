import { Elysia } from 'elysia';
import type { CreateSchemaRequest, Schema, GetSchemaRequest, ListSchemasRequest, ListSchemasResponse, ResolveSchemaOOBIRequest, ResolveSchemaOOBIResponse } from './types';
import { createSchemaWithClient, getSchemaWithClient, listSchemasWithClient, resolveSchemaOOBIWithClient } from './impl/schemaOperations';

interface SchemaRegistryStore {
  create(request: CreateSchemaRequest, timeoutMs?: number): Promise<Schema>;
  get(request: GetSchemaRequest, timeoutMs?: number): Promise<Schema | null>;
  list(request: ListSchemasRequest, timeoutMs?: number): Promise<ListSchemasResponse>;
  resolveOOBI(request: ResolveSchemaOOBIRequest, timeoutMs?: number): Promise<ResolveSchemaOOBIResponse>;
}

function makeSchemaRegistryStore(): SchemaRegistryStore {
  return {
    async create(request: CreateSchemaRequest, timeoutMs: number = 2000): Promise<Schema> {
      return await createSchemaWithClient(request, timeoutMs);
    },
    
    async get(request: GetSchemaRequest, timeoutMs: number = 2000): Promise<Schema | null> {
      return await getSchemaWithClient(request, timeoutMs);
    },
    
    async list(request: ListSchemasRequest, timeoutMs: number = 2000): Promise<ListSchemasResponse> {
      return await listSchemasWithClient(request, timeoutMs);
    },
    
    async resolveOOBI(request: ResolveSchemaOOBIRequest, timeoutMs: number = 2000): Promise<ResolveSchemaOOBIResponse> {
      return await resolveSchemaOOBIWithClient(request, timeoutMs);
    },
  };
}

export const schemaContext = new Elysia({ name: 'schemaRegistry' })
  .state('schemaRegistry', makeSchemaRegistryStore())
  .derive(({ store }) => ({
    schemaRegistry: store.schemaRegistry
  }))
  .decorate('schemaRegistry', makeSchemaRegistryStore());