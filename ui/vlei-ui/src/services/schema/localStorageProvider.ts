// LocalStorage-based schema storage provider
import { 
  SchemaStorageProvider, 
  SchemaData, 
  SchemaMetadata, 
  CreateSchemaRequest, 
  UpdateSchemaRequest, 
  SchemaQuery, 
  SchemaSearchResult 
} from './types';
import { Saider } from 'signify-ts';

export class LocalStorageSchemaProvider implements SchemaStorageProvider {
  private readonly storageKey = 'vlei-schemas';
  private readonly metadataKey = 'vlei-schemas-metadata';

  private generateId(): string {
    return `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSchemas(): Record<string, SchemaData> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load schemas from localStorage:', error);
      return {};
    }
  }

  private saveSchemas(schemas: Record<string, SchemaData>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(schemas));
    } catch (error) {
      console.error('Failed to save schemas to localStorage:', error);
      throw new Error('Failed to save schema: localStorage quota exceeded or unavailable');
    }
  }

  private computeSAID(jsonSchema: any): string {
    try {
      // Ensure schema has the required structure for SAID computation
      const schemaForSaid = {
        $id: '', // Required for SAID computation
        ...jsonSchema
      };
      
      const [saider] = Saider.saidify(schemaForSaid, undefined, undefined, '$id');
      return saider.qb64;
    } catch (error) {
      console.error('Failed to compute schema SAID:', error);
      throw new Error('Invalid schema structure for SAID computation');
    }
  }

  private matchesQuery(schema: SchemaData, query: SchemaQuery): boolean {
    const { search, tags, createdBy, isPublic } = query;

    // Search in name and description
    if (search) {
      const searchLower = search.toLowerCase();
      const nameMatch = schema.metadata.name.toLowerCase().includes(searchLower);
      const descMatch = schema.metadata.description?.toLowerCase().includes(searchLower) || false;
      if (!nameMatch && !descMatch) return false;
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      const schemaTags = schema.metadata.tags || [];
      if (!tags.some(tag => schemaTags.includes(tag))) return false;
    }

    // Filter by creator
    if (createdBy && schema.metadata.createdBy !== createdBy) return false;

    // Filter by public/private
    if (isPublic !== undefined && schema.metadata.isPublic !== isPublic) return false;

    return true;
  }

  private sortSchemas(schemas: SchemaData[], sortBy: string, sortOrder: string): SchemaData[] {
    return schemas.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.metadata.name.toLowerCase();
          bValue = b.metadata.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.metadata.createdAt);
          bValue = new Date(b.metadata.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.metadata.updatedAt);
          bValue = new Date(b.metadata.updatedAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  async create(request: CreateSchemaRequest): Promise<SchemaData> {
    const schemas = this.getSchemas();
    const id = this.generateId();
    const now = new Date().toISOString();
    
    // Compute SAID for the schema
    const said = this.computeSAID(request.jsonSchema);
    
    // Check if schema with this SAID already exists
    const existingSchema = Object.values(schemas).find(s => s.metadata.said === said);
    if (existingSchema) {
      throw new Error(`Schema with SAID ${said} already exists`);
    }

    const metadata: SchemaMetadata = {
      id,
      said,
      name: request.name,
      description: request.description,
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      tags: request.tags || [],
      isPublic: request.isPublic || false
    };

    const schemaData: SchemaData = {
      metadata,
      jsonSchema: request.jsonSchema,
      fields: request.fields || []
    };

    schemas[id] = schemaData;
    this.saveSchemas(schemas);

    console.log(`Created schema: ${metadata.name} (${said})`);
    return schemaData;
  }

  async read(id: string): Promise<SchemaData | null> {
    const schemas = this.getSchemas();
    return schemas[id] || null;
  }

  async readBySaid(said: string): Promise<SchemaData | null> {
    const schemas = this.getSchemas();
    return Object.values(schemas).find(s => s.metadata.said === said) || null;
  }

  async update(id: string, request: UpdateSchemaRequest): Promise<SchemaData> {
    const schemas = this.getSchemas();
    const existing = schemas[id];
    
    if (!existing) {
      throw new Error(`Schema with id ${id} not found`);
    }

    const now = new Date().toISOString();
    
    // If JSON schema is being updated, recompute SAID
    let newSaid = existing.metadata.said;
    if (request.jsonSchema) {
      newSaid = this.computeSAID(request.jsonSchema);
      
      // Check if new SAID conflicts with existing schema (unless it's the same schema)
      const conflictingSchema = Object.values(schemas).find(s => 
        s.metadata.said === newSaid && s.metadata.id !== id
      );
      if (conflictingSchema) {
        throw new Error(`Schema with SAID ${newSaid} already exists`);
      }
    }

    const updatedMetadata: SchemaMetadata = {
      ...existing.metadata,
      name: request.name ?? existing.metadata.name,
      description: request.description ?? existing.metadata.description,
      said: newSaid,
      updatedAt: now,
      tags: request.tags ?? existing.metadata.tags,
      isPublic: request.isPublic ?? existing.metadata.isPublic
    };

    const updatedSchema: SchemaData = {
      metadata: updatedMetadata,
      jsonSchema: request.jsonSchema ?? existing.jsonSchema,
      fields: request.fields ?? existing.fields
    };

    schemas[id] = updatedSchema;
    this.saveSchemas(schemas);

    console.log(`Updated schema: ${updatedMetadata.name} (${newSaid})`);
    return updatedSchema;
  }

  async delete(id: string): Promise<boolean> {
    const schemas = this.getSchemas();
    
    if (!schemas[id]) {
      return false;
    }

    const schemaName = schemas[id].metadata.name;
    delete schemas[id];
    this.saveSchemas(schemas);

    console.log(`Deleted schema: ${schemaName} (${id})`);
    return true;
  }

  async list(query: SchemaQuery = {}): Promise<SchemaSearchResult> {
    const schemas = this.getSchemas();
    let results = Object.values(schemas);

    // Apply filters
    results = results.filter(schema => this.matchesQuery(schema, query));

    // Apply sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    results = this.sortSchemas(results, sortBy, sortOrder);

    // Apply pagination
    const total = results.length;
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    
    const paginatedResults = results.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      schemas: paginatedResults,
      total,
      hasMore
    };
  }

  async exists(said: string): Promise<boolean> {
    const schema = await this.readBySaid(said);
    return schema !== null;
  }

  async bulkCreate(requests: CreateSchemaRequest[]): Promise<SchemaData[]> {
    const results: SchemaData[] = [];
    for (const request of requests) {
      try {
        const schema = await this.create(request);
        results.push(schema);
      } catch (error) {
        console.error(`Failed to create schema ${request.name}:`, error);
        throw error;
      }
    }
    return results;
  }

  async bulkDelete(ids: string[]): Promise<boolean[]> {
    const results: boolean[] = [];
    for (const id of ids) {
      const result = await this.delete(id);
      results.push(result);
    }
    return results;
  }

  async getSchemaForOOBI(said: string): Promise<any | null> {
    const schema = await this.readBySaid(said);
    return schema ? schema.jsonSchema : null;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test localStorage availability
      const testKey = 'vlei-test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getProviderInfo() {
    return {
      name: 'LocalStorage Schema Provider',
      type: 'local' as const,
      version: '1.0.0',
      capabilities: [
        'create', 'read', 'update', 'delete',
        'list', 'search', 'bulk_operations',
        'offline_access'
      ]
    };
  }
}