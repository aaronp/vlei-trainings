import { Elysia, t } from 'elysia';
import type { CreateSchemaRequest, GetSchemaRequest, ListSchemasRequest, ResolveSchemaOOBIRequest } from './types';
import {
  CreateSchemaRequestSchema,
  SchemaSchema,
  ListSchemasResponseSchema,
  ResolveSchemaOOBIRequestSchema,
  ResolveSchemaOOBIResponseSchema,
} from './types';
import { schemaContext } from './context';
import { branContext } from '../middleware/branContext';

export const schemasRoutes = new Elysia({ prefix: '/schemas' })
  .use(branContext)
  .use(schemaContext)
  // Create schema
  .post('/', async ({ body, schemaRegistry, headers, branContext }) => {
    const request = body as CreateSchemaRequest;
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const schema = await schemaRegistry.create(request, timeoutMs, branContext.bran);
    return { schema };
  }, {
    body: CreateSchemaRequestSchema,
    response: {
      201: t.Object({
        schema: SchemaSchema
      })
    },
    detail: {
      tags: ['Schemas'],
      description: 'Create a new schema and generate its SAID',
    },
  })
  // Get schema by SAID
  .get('/:said', async ({ params, schemaRegistry, headers, branContext }) => {
    const request: GetSchemaRequest = { said: params.said };
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const schema = await schemaRegistry.get(request, timeoutMs, branContext.bran);
    
    if (!schema) {
      throw new Error('Schema not found');
    }
    
    return { schema };
  }, {
    params: t.Object({
      said: t.String({ description: 'The Self-Addressing Identifier (SAID) of the schema' })
    }),
    response: {
      200: t.Object({
        schema: SchemaSchema
      }),
      404: t.Object({
        error: t.String()
      })
    },
    detail: {
      tags: ['Schemas'],
      description: 'Get a schema by its SAID',
    },
  })
  // List schemas
  .get('/', async ({ query, schemaRegistry, headers, branContext }) => {
    const request: ListSchemasRequest = {
      limit: query.limit,
      offset: query.offset
    };
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const schemas = await schemaRegistry.list(request, timeoutMs, branContext.bran);
    return { schemas };
  }, {
    query: t.Object({
      limit: t.Optional(t.Number({ default: 10, minimum: 1, maximum: 100 })),
      offset: t.Optional(t.Number({ default: 0, minimum: 0 }))
    }),
    response: {
      200: t.Object({
        schemas: ListSchemasResponseSchema
      })
    },
    detail: {
      tags: ['Schemas'],
      description: 'List all schemas with pagination',
    },
  })
  // Resolve schema OOBI
  .post('/resolve-oobi', async ({ body, schemaRegistry, headers, branContext }) => {
    const request = body as ResolveSchemaOOBIRequest;
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const result = await schemaRegistry.resolveOOBI(request, timeoutMs, branContext.bran);
    return result;
  }, {
    body: ResolveSchemaOOBIRequestSchema,
    response: {
      200: ResolveSchemaOOBIResponseSchema
    },
    detail: {
      tags: ['Schemas'],
      description: 'Resolve a schema OOBI to load the schema into KERIA',
    },
  });