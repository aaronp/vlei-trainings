// Schema service with pluggable storage providers
import { 
  SchemaStorageProvider, 
  SchemaData, 
  CreateSchemaRequest, 
  UpdateSchemaRequest, 
  SchemaQuery, 
  SchemaSearchResult 
} from './types';
import { LocalStorageSchemaProvider } from './localStorageProvider';
import { RemoteApiSchemaProvider, RemoteApiConfig } from './remoteApiProvider';

export type SchemaProviderType = 'localStorage' | 'remoteApi';

export interface SchemaServiceConfig {
  provider: SchemaProviderType;
  remoteApiConfig?: RemoteApiConfig;
  fallbackToLocalStorage?: boolean;
}

export class SchemaService {
  private provider: SchemaStorageProvider;
  private fallbackProvider?: SchemaStorageProvider;
  private config: SchemaServiceConfig;

  constructor(config: SchemaServiceConfig) {
    this.config = config;
    this.provider = this.createProvider(config.provider, config.remoteApiConfig);
    
    // Set up fallback provider if enabled
    if (config.fallbackToLocalStorage && config.provider !== 'localStorage') {
      this.fallbackProvider = new LocalStorageSchemaProvider();
    }
  }

  private createProvider(type: SchemaProviderType, remoteConfig?: RemoteApiConfig): SchemaStorageProvider {
    switch (type) {
      case 'localStorage':
        return new LocalStorageSchemaProvider();
      case 'remoteApi':
        if (!remoteConfig) {
          throw new Error('Remote API config required for remoteApi provider');
        }
        return new RemoteApiSchemaProvider(remoteConfig);
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  private async executeWithFallback<T>(
    operation: (provider: SchemaStorageProvider) => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await operation(this.provider);
    } catch (error) {
      console.warn(`${operationName} failed with primary provider:`, error);
      
      if (this.fallbackProvider) {
        console.log(`Trying fallback provider for ${operationName}`);
        try {
          return await operation(this.fallbackProvider);
        } catch (fallbackError) {
          console.error(`${operationName} also failed with fallback provider:`, fallbackError);
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }

  // CRUD operations with fallback support
  async createSchema(request: CreateSchemaRequest): Promise<SchemaData> {
    return await this.executeWithFallback(
      provider => provider.create(request),
      'createSchema'
    );
  }

  async getSchema(id: string): Promise<SchemaData | null> {
    return await this.executeWithFallback(
      provider => provider.read(id),
      'getSchema'
    );
  }

  async getSchemaBySaid(said: string): Promise<SchemaData | null> {
    return await this.executeWithFallback(
      provider => provider.readBySaid(said),
      'getSchemaBySaid'
    );
  }

  async updateSchema(id: string, request: UpdateSchemaRequest): Promise<SchemaData> {
    return await this.executeWithFallback(
      provider => provider.update(id, request),
      'updateSchema'
    );
  }

  async deleteSchema(id: string): Promise<boolean> {
    return await this.executeWithFallback(
      provider => provider.delete(id),
      'deleteSchema'
    );
  }

  async listSchemas(query?: SchemaQuery): Promise<SchemaSearchResult> {
    return await this.executeWithFallback(
      provider => provider.list(query),
      'listSchemas'
    );
  }

  async schemaExists(said: string): Promise<boolean> {
    return await this.executeWithFallback(
      provider => provider.exists(said),
      'schemaExists'
    );
  }

  async bulkCreateSchemas(requests: CreateSchemaRequest[]): Promise<SchemaData[]> {
    return await this.executeWithFallback(
      provider => provider.bulkCreate(requests),
      'bulkCreateSchemas'
    );
  }

  async bulkDeleteSchemas(ids: string[]): Promise<boolean[]> {
    return await this.executeWithFallback(
      provider => provider.bulkDelete(ids),
      'bulkDeleteSchemas'
    );
  }

  async getSchemaForOOBI(said: string): Promise<any | null> {
    return await this.executeWithFallback(
      provider => provider.getSchemaForOOBI(said),
      'getSchemaForOOBI'
    );
  }

  // Provider management
  async isProviderAvailable(): Promise<boolean> {
    try {
      return await this.provider.isAvailable();
    } catch {
      return false;
    }
  }

  async isFallbackAvailable(): Promise<boolean> {
    if (!this.fallbackProvider) return false;
    try {
      return await this.fallbackProvider.isAvailable();
    } catch {
      return false;
    }
  }

  getProviderInfo() {
    return this.provider.getProviderInfo();
  }

  getFallbackProviderInfo() {
    return this.fallbackProvider?.getProviderInfo() || null;
  }

  // Switch provider (useful for configuration changes)
  switchProvider(type: SchemaProviderType, remoteConfig?: RemoteApiConfig) {
    this.provider = this.createProvider(type, remoteConfig);
    this.config = { ...this.config, provider: type, remoteApiConfig: remoteConfig };
  }

  // Health check for both providers
  async getHealthStatus(): Promise<{
    primary: { available: boolean; info: any; error?: string };
    fallback?: { available: boolean; info: any; error?: string };
  }> {
    const result: any = { primary: { available: false, info: this.getProviderInfo() } };

    try {
      result.primary.available = await this.provider.isAvailable();
    } catch (error) {
      result.primary.error = (error as Error).message;
    }

    if (this.fallbackProvider) {
      result.fallback = { available: false, info: this.fallbackProvider.getProviderInfo() };
      try {
        result.fallback.available = await this.fallbackProvider.isAvailable();
      } catch (error) {
        result.fallback.error = (error as Error).message;
      }
    }

    return result;
  }

  // Search with advanced features
  async searchSchemas(searchTerm: string, options?: {
    limit?: number;
    includeFields?: boolean;
    tags?: string[];
  }): Promise<SchemaData[]> {
    const query: SchemaQuery = {
      search: searchTerm,
      limit: options?.limit || 20,
      tags: options?.tags,
      sortBy: 'name',
      sortOrder: 'asc'
    };

    const result = await this.listSchemas(query);
    return result.schemas;
  }

  // Get schemas by tags
  async getSchemasByTags(tags: string[]): Promise<SchemaData[]> {
    const result = await this.listSchemas({ tags });
    return result.schemas;
  }

  // Get recent schemas
  async getRecentSchemas(limit: number = 10): Promise<SchemaData[]> {
    const result = await this.listSchemas({
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    return result.schemas;
  }

  // Export/Import functionality
  async exportSchemas(): Promise<{ schemas: SchemaData[]; exportedAt: string; version: string }> {
    const result = await this.listSchemas();
    return {
      schemas: result.schemas,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  async importSchemas(exportData: { schemas: SchemaData[] }): Promise<{ 
    imported: number; 
    skipped: number; 
    errors: string[] 
  }> {
    const results = { imported: 0, skipped: 0, errors: [] };

    for (const schemaData of exportData.schemas) {
      try {
        // Check if schema already exists
        const exists = await this.schemaExists(schemaData.metadata.said);
        if (exists) {
          results.skipped++;
          continue;
        }

        // Create the schema
        await this.createSchema({
          name: schemaData.metadata.name,
          description: schemaData.metadata.description,
          jsonSchema: schemaData.jsonSchema,
          fields: schemaData.fields,
          tags: schemaData.metadata.tags,
          isPublic: schemaData.metadata.isPublic
        });

        results.imported++;
      } catch (error) {
        results.errors.push(`Failed to import ${schemaData.metadata.name}: ${(error as Error).message}`);
      }
    }

    return results;
  }
}

// Global service instance
let schemaServiceInstance: SchemaService | null = null;

export const getSchemaService = (): SchemaService => {
  if (!schemaServiceInstance) {
    throw new Error('Schema service not initialized. Call initializeSchemaService first.');
  }
  return schemaServiceInstance;
};

export const initializeSchemaService = (config: SchemaServiceConfig): SchemaService => {
  schemaServiceInstance = new SchemaService(config);
  return schemaServiceInstance;
};

// Default initialization with localStorage
export const initializeDefaultSchemaService = (): SchemaService => {
  return initializeSchemaService({
    provider: 'localStorage',
    fallbackToLocalStorage: false
  });
};