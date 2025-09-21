// Schema API Client - HTTP client for the schema REST API service
import type { SchemaData, CreateSchemaRequest, CredentialField } from './schemaStorage.js';

export interface SchemaApiResponse {
  schemas: Array<{
    metadata: {
      id: string;
      said: string;
      name: string;
      description?: string;
      version: string;
      createdAt: string;
      updatedAt: string;
      tags: string[];
      isPublic: boolean;
    };
    jsonSchema: any;
    fields?: CredentialField[];
  }>;
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

export interface CreateSchemaApiRequest {
  name: string;
  description?: string;
  jsonSchema: any;
  fields?: CredentialField[];
  tags?: string[];
  isPublic?: boolean;
}

export interface CreateSchemaApiResponse {
  id: string;
  said: string;
  name: string;
  description?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isPublic: boolean;
}

export class SchemaApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Default to current origin in browser, fallback for Node.js testing
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
  }

  /**
   * List schemas from the API
   */
  async listSchemas(options?: {
    offset?: number;
    limit?: number;
    search?: string;
    tags?: string[];
  }): Promise<SchemaApiResponse> {
    const params = new URLSearchParams();
    
    if (options?.offset !== undefined) params.set('offset', options.offset.toString());
    if (options?.limit !== undefined) params.set('limit', options.limit.toString());
    if (options?.search) params.set('search', options.search);
    if (options?.tags?.length) params.set('tags', options.tags.join(','));

    const url = `${this.baseUrl}/api/schemas${params.toString() ? `?${params}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to list schemas: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Get a specific schema by SAID
   */
  async getSchema(said: string): Promise<SchemaApiResponse['schemas'][0] | null> {
    const response = await fetch(`${this.baseUrl}/api/schemas/${said}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to get schema: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Create a new schema via the API
   */
  async createSchema(request: CreateSchemaApiRequest): Promise<CreateSchemaApiResponse> {
    const response = await fetch(`${this.baseUrl}/api/schemas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create schema: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Update an existing schema
   */
  async updateSchema(said: string, request: Partial<CreateSchemaApiRequest>): Promise<CreateSchemaApiResponse> {
    const response = await fetch(`${this.baseUrl}/api/schemas/${said}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update schema: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Delete a schema
   */
  async deleteSchema(said: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/schemas/${said}`, {
      method: 'DELETE'
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`Failed to delete schema: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  /**
   * Check if a schema exists
   */
  async schemaExists(said: string): Promise<boolean> {
    try {
      const schema = await this.getSchema(said);
      return schema !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get schema OOBI URL
   */
  getSchemaOOBI(said: string): string {
    return `${this.baseUrl}/oobi/${said}`;
  }
  
  /**
   * Get schema OOBI URL for KERIA (uses Docker bridge gateway when running in Docker)
   */
  getSchemaOOBIForKERIA(said: string): string {
    // When KERIA is running in Docker and needs to access the host machine
    // Use the Docker bridge gateway IP (172.22.0.1 for this network)
    const keriaAccessibleUrl = this.baseUrl.replace('localhost', '172.22.0.1');
    return `${keriaAccessibleUrl}/oobi/${said}`;
  }

  /**
   * Fetch schema data via OOBI endpoint
   */
  async getSchemaViaOOBI(said: string): Promise<any> {
    const response = await fetch(this.getSchemaOOBI(said));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch schema via OOBI: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Verify OOBI endpoint is accessible
   */
  async verifyOOBIEndpoint(said: string): Promise<boolean> {
    try {
      // Use GET instead of HEAD since some servers don't support HEAD properly
      const response = await fetch(this.getSchemaOOBI(said));
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API server status
   */
  async getServerStatus(): Promise<{ 
    available: boolean; 
    schemaCount: number; 
    serverUrl: string;
    version?: string;
  }> {
    try {
      // Try to get a small list to test connectivity
      const response = await this.listSchemas({ limit: 1 });
      return {
        available: true,
        schemaCount: response.total,
        serverUrl: this.baseUrl,
      };
    } catch (error) {
      return {
        available: false,
        schemaCount: 0,
        serverUrl: this.baseUrl,
      };
    }
  }
}

// Create singleton instance
export const schemaApiClient = new SchemaApiClient();