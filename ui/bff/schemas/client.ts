import { treaty } from '@elysiajs/eden';
import type { schemasRoutes } from './index';
import type { CreateSchemaRequest, Schema, GetSchemaRequest, ListSchemasRequest, ListSchemasResponse } from './types';

// Type for the combined routes
type SchemasApi = typeof schemasRoutes;

export class SchemasClient {
  private client: ReturnType<typeof treaty<SchemasApi>>;

  constructor(url: string) {
    this.client = treaty<SchemasApi>(url);
  }

  // Schema operations
  async createSchema(request: CreateSchemaRequest, timeoutMs?: number): Promise<{ schema: Schema }> {
    const headers: Record<string, string> = {};
    if (timeoutMs) {
      headers['x-timeout'] = timeoutMs.toString();
    }

    const response = await this.client.schemas.post(request, { headers });

    if (response.error) {
      const errorMessage = typeof response.error.value === 'string' 
        ? response.error.value 
        : JSON.stringify(response.error.value);
      throw new Error(`Failed to create schema: ${errorMessage}`);
    }

    return response.data;
  }

  async getSchema(said: string, timeoutMs?: number): Promise<{ schema: Schema | null }> {
    const headers: Record<string, string> = {};
    if (timeoutMs) {
      headers['x-timeout'] = timeoutMs.toString();
    }

    const response = await this.client.schemas[said].get({ headers });

    if (response.error) {
      throw new Error(`Failed to get schema: ${response.error.value}`);
    }

    return response.data;
  }

  async listSchemas(params?: { limit?: number; offset?: number }, timeoutMs?: number): Promise<{ schemas: ListSchemasResponse }> {
    const headers: Record<string, string> = {};
    if (timeoutMs) {
      headers['x-timeout'] = timeoutMs.toString();
    }

    const response = await this.client.schemas.get({ 
      query: params,
      headers 
    });

    if (response.error) {
      throw new Error(`Failed to list schemas: ${response.error.value}`);
    }

    return response.data;
  }
}

// Factory function to create client
export const schemasClient = (url: string = 'http://localhost:3001'): SchemasClient => {
  return new SchemasClient(url);
};