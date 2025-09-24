import { t } from 'elysia';

export interface CreateSchemaRequest {
  schema: Record<string, any>;
  description?: string;
}

export interface Schema {
  said: string;
  schema: Record<string, any>;
  description?: string;
  createdAt: string;
}

export interface GetSchemaRequest {
  said: string;
}

export interface ListSchemasRequest {
  limit?: number;
  offset?: number;
}

export interface ListSchemasResponse {
  schemas: Schema[];
  total: number;
  limit: number;
  offset: number;
}

export interface ResolveSchemaOOBIRequest {
  schemaSaid: string;
}

export interface ResolveSchemaOOBIResponse {
  success: boolean;
  message: string;
}

// Request Schemas
export const CreateSchemaRequestSchema = t.Object({
  schema: t.Record(t.String(), t.Any(), { description: 'The JSON schema definition' }),
  description: t.Optional(t.String({ description: 'Optional description of the schema' }))
});

export const GetSchemaRequestSchema = t.Object({
  said: t.String({ description: 'The Self-Addressing Identifier (SAID) of the schema' })
});

export const ListSchemasRequestSchema = t.Object({
  limit: t.Optional(t.Number({ default: 10, minimum: 1, maximum: 100 })),
  offset: t.Optional(t.Number({ default: 0, minimum: 0 }))
});

// Response Schemas
export const SchemaSchema = t.Object({
  said: t.String(),
  schema: t.Record(t.String(), t.Any()),
  description: t.Optional(t.String()),
  createdAt: t.String()
});

export const ListSchemasResponseSchema = t.Object({
  schemas: t.Array(SchemaSchema),
  total: t.Number(),
  limit: t.Number(),
  offset: t.Number()
});

export const ResolveSchemaOOBIRequestSchema = t.Object({
  schemaSaid: t.String({ description: 'The Self-Addressing Identifier (SAID) of the schema to resolve' })
});

export const ResolveSchemaOOBIResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String()
});