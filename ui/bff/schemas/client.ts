import { treaty } from '@elysiajs/eden';
import type { schemasRoutes } from './index';
import type { CreateSchemaRequest, Schema, GetSchemaRequest, ListSchemasRequest, ListSchemasResponse, ResolveSchemaOOBIRequest, ResolveSchemaOOBIResponse } from './types';

// Type for the combined routes
type SchemasApi = typeof schemasRoutes;

export class SchemasClient {
  private client: ReturnType<typeof treaty<SchemasApi>>;
  private bran?: string;

  constructor(url: string, bran?: string) {
    this.client = treaty<SchemasApi>(url);
    this.bran = bran;
  }

  // Update the bran (useful after receiving it from response headers)
  setBran(bran: string) {
    this.bran = bran;
  }

  // Get the current bran
  getBran(): string | undefined {
    return this.bran;
  }

  // Schema operations
  async createSchema(request: CreateSchemaRequest, timeoutMs?: number): Promise<{ schema: Schema; bran?: string }> {
    const headers: Record<string, string> = {};
    if (timeoutMs) {
      headers['x-timeout'] = timeoutMs.toString();
    }
    if (this.bran) {
      headers['x-keria-bran'] = this.bran;
    }

    const response = await this.client.schemas.post(request, { headers });

    if (response.error) {
      const errorMessage = typeof response.error.value === 'string' 
        ? response.error.value 
        : JSON.stringify(response.error.value);
      throw new Error(`Failed to create schema: ${errorMessage}`);
    }

    // Extract bran from response headers if present
    const responseBran = response.headers?.['x-keria-bran'];
    if (responseBran) {
      this.bran = responseBran; // Update stored bran
    }

    return {
      ...response.data,
      bran: responseBran
    };
  }

  async getSchema(said: string, timeoutMs?: number): Promise<{ schema: Schema | null; bran?: string }> {
    const headers: Record<string, string> = {};
    if (timeoutMs) {
      headers['x-timeout'] = timeoutMs.toString();
    }
    if (this.bran) {
      headers['x-keria-bran'] = this.bran;
    }

    const response = await this.client.schemas[said].get({ headers });

    if (response.error) {
      throw new Error(`Failed to get schema: ${response.error.value}`);
    }

    // Extract bran from response headers if present
    const responseBran = response.headers?.['x-keria-bran'];
    if (responseBran) {
      this.bran = responseBran; // Update stored bran
    }

    return {
      ...response.data,
      bran: responseBran
    };
  }

  async listSchemas(params?: { limit?: number; offset?: number }, timeoutMs?: number): Promise<{ schemas: ListSchemasResponse; bran?: string }> {
    const headers: Record<string, string> = {};
    if (timeoutMs) {
      headers['x-timeout'] = timeoutMs.toString();
    }
    if (this.bran) {
      headers['x-keria-bran'] = this.bran;
    }

    const response = await this.client.schemas.get({ 
      query: params,
      headers 
    });

    if (response.error) {
      throw new Error(`Failed to list schemas: ${response.error.value}`);
    }

    // Extract bran from response headers if present
    const responseBran = response.headers?.['x-keria-bran'];
    if (responseBran) {
      this.bran = responseBran; // Update stored bran
    }

    return {
      ...response.data,
      bran: responseBran
    };
  }

  async resolveSchemaOOBI(request: ResolveSchemaOOBIRequest, timeoutMs?: number): Promise<ResolveSchemaOOBIResponse & { bran?: string }> {
    const headers: Record<string, string> = {};
    if (timeoutMs) {
      headers['x-timeout'] = timeoutMs.toString();
    }
    if (this.bran) {
      headers['x-keria-bran'] = this.bran;
    }

    const response = await this.client.schemas['resolve-oobi'].post(request, { headers });

    if (response.error) {
      throw new Error(`Failed to resolve schema OOBI: ${response.error.value}`);
    }

    // Extract bran from response headers if present
    const responseBran = response.headers?.['x-keria-bran'];
    if (responseBran) {
      this.bran = responseBran; // Update stored bran
    }

    return {
      ...response.data,
      bran: responseBran
    };
  }
}

// Factory function to create client
export const schemasClient = (url: string = 'http://localhost:3001', bran?: string): SchemasClient => {
  return new SchemasClient(url, bran);
};