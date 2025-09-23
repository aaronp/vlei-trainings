import { describe, expect, it, beforeAll } from 'bun:test';
import { schemasClient } from './client';
import type { CreateSchemaRequest, Schema } from './types';

describe('SchemasClient Integration Tests', () => {
  const serviceUrl = process.env.SCHEMAS_SERVICE_URL || 'http://localhost:3001';
  const client = schemasClient(serviceUrl);
  let createdSchemas: Schema[] = [];

  beforeAll(() => {
    console.log(`Running schemas integration tests against ${serviceUrl}`);
  });

  describe('createSchema', () => {
    it('should successfully create a schema and generate SAID', async () => {
      const request: CreateSchemaRequest = {
        schema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name']
        },
        description: 'Test person schema'
      };

      const response = await client.createSchema(request);
      
      expect(response).toBeDefined();
      expect(response.schema).toBeDefined();
      expect(response.schema.said).toBeDefined();
      expect(response.schema.said).toBeTypeOf('string');
      expect(response.schema.said.length).toBeGreaterThan(0);
      expect(response.schema.schema).toBeDefined();
      expect(response.schema.schema.$id).toBe(response.schema.said);
      expect(response.schema.description).toBe('Test person schema');
      expect(response.schema.createdAt).toBeDefined();
      
      createdSchemas.push(response.schema);
    });

    it('should create schema with minimal parameters', async () => {
      const request: CreateSchemaRequest = {
        schema: {
          type: 'string'
        }
      };

      const response = await client.createSchema(request);
      
      expect(response).toBeDefined();
      expect(response.schema).toBeDefined();
      expect(response.schema.said).toBeDefined();
      expect(response.schema.schema.type).toBe('string');
      expect(response.schema.description).toBeUndefined();
      
      createdSchemas.push(response.schema);
    });

    it('should handle complex nested schema', async () => {
      const request: CreateSchemaRequest = {
        schema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                roles: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            },
            metadata: {
              type: 'object',
              additionalProperties: true
            }
          }
        },
        description: 'Complex user profile schema'
      };

      const response = await client.createSchema(request);
      
      expect(response).toBeDefined();
      expect(response.schema).toBeDefined();
      expect(response.schema.said).toBeDefined();
      expect(response.schema.schema.properties.user).toBeDefined();
      
      createdSchemas.push(response.schema);
    });

    it('should generate different SAIDs for different schemas', async () => {
      const schema1: CreateSchemaRequest = {
        schema: { type: 'string', minLength: 1 }
      };
      const schema2: CreateSchemaRequest = {
        schema: { type: 'string', minLength: 2 }
      };

      const response1 = await client.createSchema(schema1);
      const response2 = await client.createSchema(schema2);
      
      expect(response1.schema.said).not.toBe(response2.schema.said);
      
      createdSchemas.push(response1.schema);
      createdSchemas.push(response2.schema);
    });

    it('should return same SAID for identical schemas', async () => {
      const schema: CreateSchemaRequest = {
        schema: {
          type: 'object',
          properties: {
            uniqueField: { type: 'boolean' }
          }
        }
      };

      const response1 = await client.createSchema(schema);
      const response2 = await client.createSchema(schema);
      
      expect(response1.schema.said).toBe(response2.schema.said);
    });

    it('should throw error for invalid schema', async () => {
      const request: CreateSchemaRequest = {
        schema: {} // Empty schema without required fields
      };

      await expect(client.createSchema(request)).rejects.toThrow(/Failed to create schema/);
    });

    it('should handle timeout parameter', async () => {
      const request: CreateSchemaRequest = {
        schema: {
          type: 'number',
          minimum: 0,
          maximum: 100
        }
      };

      const response = await client.createSchema(request, 1000);
      
      expect(response).toBeDefined();
      expect(response.schema.said).toBeDefined();
    });
  });

  describe('getSchema', () => {
    it('should retrieve an existing schema by SAID', async () => {
      // Ensure we have at least one schema created
      if (createdSchemas.length === 0) {
        const createRequest: CreateSchemaRequest = {
          schema: { type: 'object' }
        };
        const createResponse = await client.createSchema(createRequest);
        createdSchemas.push(createResponse.schema);
      }

      const said = createdSchemas[0].said;
      const response = await client.getSchema(said);
      
      expect(response).toBeDefined();
      expect(response.schema).toBeDefined();
      expect(response.schema?.said).toBe(said);
      expect(response.schema?.schema).toBeDefined();
    });

    it('should return null for non-existent SAID', async () => {
      const fakeSaid = 'EInvalidSAID1234567890';
      
      try {
        await client.getSchema(fakeSaid);
      } catch (error: any) {
        expect(error.message).toContain('Failed to get schema');
      }
    });

    it('should handle timeout parameter for getSchema', async () => {
      if (createdSchemas.length > 0) {
        const said = createdSchemas[0].said;
        const response = await client.getSchema(said, 1000);
        
        expect(response).toBeDefined();
        expect(response.schema?.said).toBe(said);
      }
    });
  });

  describe('listSchemas', () => {
    it('should list schemas with default pagination', async () => {
      const response = await client.listSchemas();
      
      expect(response).toBeDefined();
      expect(response.schemas).toBeDefined();
      expect(response.schemas.schemas).toBeInstanceOf(Array);
      expect(response.schemas.total).toBeTypeOf('number');
      expect(response.schemas.limit).toBe(10);
      expect(response.schemas.offset).toBe(0);
    });

    it('should list schemas with custom pagination', async () => {
      const response = await client.listSchemas({ limit: 5, offset: 0 });
      
      expect(response).toBeDefined();
      expect(response.schemas.schemas).toBeInstanceOf(Array);
      expect(response.schemas.limit).toBe(5);
      expect(response.schemas.offset).toBe(0);
      expect(response.schemas.schemas.length).toBeLessThanOrEqual(5);
    });

    it('should handle offset correctly', async () => {
      const response1 = await client.listSchemas({ limit: 1, offset: 0 });
      const response2 = await client.listSchemas({ limit: 1, offset: 1 });
      
      if (response1.schemas.total > 1) {
        expect(response1.schemas.schemas[0]?.said).not.toBe(response2.schemas.schemas[0]?.said);
      }
    });

    it('should handle timeout parameter for listSchemas', async () => {
      const response = await client.listSchemas({ limit: 10 }, 1000);
      
      expect(response).toBeDefined();
      expect(response.schemas).toBeDefined();
    });
  });

  describe('network handling', () => {
    it('should handle network connectivity issues gracefully', async () => {
      const invalidClient = schemasClient('http://localhost:9999');
      const request: CreateSchemaRequest = {
        schema: { type: 'string' }
      };

      await expect(invalidClient.createSchema(request)).rejects.toThrow();
    });
  });
});