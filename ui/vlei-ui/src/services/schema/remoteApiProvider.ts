// Remote REST API-based schema storage provider
import { 
  SchemaStorageProvider, 
  SchemaData, 
  CreateSchemaRequest, 
  UpdateSchemaRequest, 
  SchemaQuery, 
  SchemaSearchResult 
} from './types';

export interface RemoteApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

export class RemoteApiSchemaProvider implements SchemaStorageProvider {
  private config: RemoteApiConfig;

  constructor(config: RemoteApiConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      ...config
    };
  }

  private async makeRequest<T>(
    method: string, 
    endpoint: string, 
    body?: any,
    queryParams?: Record<string, string>
  ): Promise<T> {
    let url = `${this.config.baseUrl}${endpoint}`;
    
    // Add query parameters
    if (queryParams) {
      const searchParams = new URLSearchParams(queryParams);
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const requestConfig: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    let lastError: Error;
    
    for (let attempt = 0; attempt < (this.config.retries || 3); attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // Handle empty responses (like for DELETE)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return {} as T;
        }
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${this.config.timeout}ms`);
          }
          if (error.message.includes('HTTP 4')) {
            throw error; // Client errors shouldn't be retried
          }
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < (this.config.retries || 3) - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError!;
  }

  async create(request: CreateSchemaRequest): Promise<SchemaData> {
    return await this.makeRequest<SchemaData>('POST', '/schemas', request);
  }

  async read(id: string): Promise<SchemaData | null> {
    try {
      return await this.makeRequest<SchemaData>('GET', `/schemas/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTP 404')) {
        return null;
      }
      throw error;
    }
  }

  async readBySaid(said: string): Promise<SchemaData | null> {
    try {
      return await this.makeRequest<SchemaData>('GET', `/schemas/by-said/${said}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTP 404')) {
        return null;
      }
      throw error;
    }
  }

  async update(id: string, request: UpdateSchemaRequest): Promise<SchemaData> {
    return await this.makeRequest<SchemaData>('PUT', `/schemas/${id}`, request);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.makeRequest('DELETE', `/schemas/${id}`);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTP 404')) {
        return false;
      }
      throw error;
    }
  }

  async list(query: SchemaQuery = {}): Promise<SchemaSearchResult> {
    const queryParams: Record<string, string> = {};
    
    if (query.search) queryParams.search = query.search;
    if (query.tags) queryParams.tags = query.tags.join(',');
    if (query.createdBy) queryParams.createdBy = query.createdBy;
    if (query.isPublic !== undefined) queryParams.isPublic = query.isPublic.toString();
    if (query.limit) queryParams.limit = query.limit.toString();
    if (query.offset) queryParams.offset = query.offset.toString();
    if (query.sortBy) queryParams.sortBy = query.sortBy;
    if (query.sortOrder) queryParams.sortOrder = query.sortOrder;

    return await this.makeRequest<SchemaSearchResult>('GET', '/schemas', undefined, queryParams);
  }

  async exists(said: string): Promise<boolean> {
    try {
      await this.makeRequest('HEAD', `/schemas/by-said/${said}`);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTP 404')) {
        return false;
      }
      throw error;
    }
  }

  async bulkCreate(requests: CreateSchemaRequest[]): Promise<SchemaData[]> {
    return await this.makeRequest<SchemaData[]>('POST', '/schemas/bulk', { schemas: requests });
  }

  async bulkDelete(ids: string[]): Promise<boolean[]> {
    const response = await this.makeRequest<{ results: boolean[] }>('DELETE', '/schemas/bulk', { ids });
    return response.results;
  }

  async getSchemaForOOBI(said: string): Promise<any | null> {
    try {
      return await this.makeRequest<any>('GET', `/oobi/${said}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTP 404')) {
        return null;
      }
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/health');
      return true;
    } catch {
      return false;
    }
  }

  getProviderInfo() {
    return {
      name: 'Remote API Schema Provider',
      type: 'remote' as const,
      version: '1.0.0',
      capabilities: [
        'create', 'read', 'update', 'delete',
        'list', 'search', 'bulk_operations',
        'remote_sync', 'multi_user', 'permissions'
      ]
    };
  }

  // Additional methods for remote provider
  async ping(): Promise<{ latency: number; status: string }> {
    const start = Date.now();
    await this.makeRequest('GET', '/ping');
    const latency = Date.now() - start;
    return { latency, status: 'ok' };
  }

  async getServerInfo(): Promise<{ version: string; features: string[] }> {
    return await this.makeRequest('GET', '/info');
  }

  updateConfig(newConfig: Partial<RemoteApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}