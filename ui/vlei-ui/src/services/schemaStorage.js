// Schema Storage - JavaScript version to avoid TypeScript module issues
import { Saider } from 'signify-ts';

// LocalStorage Provider
export class LocalStorageSchemaProvider {
  constructor() {
    this.storageKey = 'vlei-schemas';
    this.metadataKey = 'vlei-schemas-metadata';
  }

  getStoredSchemas() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return new Map();
      
      const schemas = JSON.parse(data);

      const map = new Map(Object.entries(schemas));
      console.log(`loaded ${map.keys.length} schemas from ${this.storageKey}`);
      return map;
    } catch (error) {
      console.error('Failed to load schemas from localStorage:', error);
      return new Map();
    }
  }

  saveStoredSchemas(schemas) {
    try {
      const data = Object.fromEntries(schemas);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      
      // Mark last sync time
      localStorage.setItem('vlei-schemas-last-sync', new Date().toISOString());
    } catch (error) {
      console.error('Failed to save schemas to localStorage:', error);
      throw new Error('Failed to save schemas');
    }
  }

  computeSAID(jsonSchema) {
    try {
      const schemaForSaid = { $id: '', ...jsonSchema };
      const [saider] = Saider.saidify(schemaForSaid, undefined, undefined, '$id');
      return saider.qb64;
    } catch (error) {
      console.error('Failed to compute SAID:', error);
      throw error;
    }
  }

  async create(request) {
    const schemas = this.getStoredSchemas();
    
    const said = this.computeSAID(request.jsonSchema);
    const id = said;
    const now = new Date().toISOString();

    // Check if schema with this SAID already exists
    for (const [, schema] of schemas) {
      if (schema.metadata.said === said) {
        throw new Error(`Schema with SAID ${said} already exists`);
      }
    }

    const schemaData = {
      metadata: {
        id,
        said,
        name: request.name,
        description: request.description,
        version: '1.0.0',
        createdAt: now,
        updatedAt: now,
        tags: request.tags || [],
        isPublic: request.isPublic || false
      },
      jsonSchema: request.jsonSchema,
      fields: request.fields
    };

    schemas.set(id, schemaData);
    this.saveStoredSchemas(schemas);
    
    return schemaData;
  }

  async read(id) {
    const schemas = this.getStoredSchemas();
    return schemas.get(id) || null;
  }

  async readBySaid(said) {
    const schemas = this.getStoredSchemas();
    for (const [, schema] of schemas) {
      if (schema.metadata.said === said) {
        return schema;
      }
    }
    return null;
  }

  async update(id, request) {
    const schemas = this.getStoredSchemas();
    const existing = schemas.get(id);
    
    if (!existing) {
      throw new Error(`Schema with id ${id} not found`);
    }

    const updatedSchema = {
      ...existing,
      metadata: {
        ...existing.metadata,
        ...(request.name && { name: request.name }),
        ...(request.description !== undefined && { description: request.description }),
        ...(request.tags && { tags: request.tags }),
        ...(request.isPublic !== undefined && { isPublic: request.isPublic }),
        updatedAt: new Date().toISOString()
      },
      ...(request.jsonSchema && { jsonSchema: request.jsonSchema }),
      ...(request.fields && { fields: request.fields })
    };

    // Recompute SAID if jsonSchema changed
    if (request.jsonSchema) {
      updatedSchema.metadata.said = this.computeSAID(request.jsonSchema);
    }

    schemas.set(id, updatedSchema);
    this.saveStoredSchemas(schemas);
    
    return updatedSchema;
  }

  async delete(id) {
    const schemas = this.getStoredSchemas();
    const deleted = schemas.delete(id);
    
    if (deleted) {
      this.saveStoredSchemas(schemas);
    }
    
    return deleted;
  }

  async list(query) {
    const schemas = this.getStoredSchemas();
    let results = Array.from(schemas.values());

    // Apply filters
    if (query?.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(schema => 
        schema.metadata.name.toLowerCase().includes(searchLower) ||
        schema.metadata.description?.toLowerCase().includes(searchLower) ||
        schema.metadata.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (query?.tags && query.tags.length > 0) {
      results = results.filter(schema =>
        query.tags.some(tag => schema.metadata.tags?.includes(tag))
      );
    }

    if (query?.isPublic !== undefined) {
      results = results.filter(schema => schema.metadata.isPublic === query.isPublic);
    }

    // Apply sorting
    if (query?.sortBy) {
      results.sort((a, b) => {
        const aVal = a.metadata[query.sortBy];
        const bVal = b.metadata[query.sortBy];
        const direction = query.sortOrder === 'desc' ? -1 : 1;
        
        if (aVal < bVal) return -1 * direction;
        if (aVal > bVal) return 1 * direction;
        return 0;
      });
    }

    // Apply pagination
    const offset = query?.offset || 0;
    const limit = query?.limit || 100;
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      schemas: paginatedResults,
      total,
      hasMore: offset + limit < total
    };
  }

  async exists(said) {
    const schemas = this.getStoredSchemas();
    for (const [, schema] of schemas) {
      if (schema.metadata.said === said) {
        return true;
      }
    }
    return false;
  }

  async bulkCreate(requests) {
    const results = [];
    for (const request of requests) {
      results.push(await this.create(request));
    }
    return results;
  }

  async bulkDelete(ids) {
    const results = [];
    for (const id of ids) {
      results.push(await this.delete(id));
    }
    return results;
  }

  async getSchemaForOOBI(said) {
    const schema = await this.readBySaid(said);
    return schema?.jsonSchema || null;
  }

  async isAvailable() {
    try {
      localStorage.setItem('vlei-schema-test', 'test');
      localStorage.removeItem('vlei-schema-test');
      return true;
    } catch {
      return false;
    }
  }

  getProviderInfo() {
    return {
      name: 'LocalStorage Schema Provider',
      type: 'local',
      version: '1.0.0',
      capabilities: ['create', 'read', 'update', 'delete', 'list', 'bulk']
    };
  }
}

// In-Memory Provider for server-side use
export class InMemorySchemaProvider {
  constructor() {
    this.schemas = new Map();
    this.metadata = {
      totalSchemas: 0,
      lastModified: new Date().toISOString()
    };
  }

  async create(request) {
    const id = request.id || `schema-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (this.schemas.has(id)) {
      throw new Error(`Schema with ID ${id} already exists`);
    }

    // Compute SAID
    const said = this.computeSAID(request.jsonSchema);
    
    // Check if schema with this SAID already exists
    for (const [existingId, existingSchema] of this.schemas) {
      if (existingSchema.metadata.said === said) {
        throw new Error(`Schema with SAID ${said} already exists with ID ${existingId}`);
      }
    }

    const now = new Date().toISOString();
    const schema = {
      metadata: {
        id,
        said,
        name: request.name,
        description: request.description,
        version: request.version || '1.0.0',
        createdAt: now,
        updatedAt: now,
        tags: request.tags || [],
        isPublic: request.isPublic || false
      },
      jsonSchema: { $id: said, ...request.jsonSchema },
      fields: request.fields || []
    };

    this.schemas.set(id, schema);
    this.metadata.totalSchemas = this.schemas.size;
    this.metadata.lastModified = now;

    console.log(`✅ Created schema in memory: ${schema.metadata.name} (${schema.metadata.said})`);
    return schema;
  }

  async read(id) {
    return this.schemas.get(id) || null;
  }

  async readBySaid(said) {
    for (const schema of this.schemas.values()) {
      if (schema.metadata.said === said) {
        return schema;
      }
    }
    return null;
  }

  async update(id, updates) {
    const existing = this.schemas.get(id);
    if (!existing) {
      throw new Error(`Schema with ID ${id} not found`);
    }

    const now = new Date().toISOString();
    
    // If jsonSchema is being updated, recompute SAID
    let newSaid = existing.metadata.said;
    if (updates.jsonSchema) {
      newSaid = this.computeSAID(updates.jsonSchema);
      
      // Check if new SAID conflicts with existing schemas
      for (const [existingId, existingSchema] of this.schemas) {
        if (existingId !== id && existingSchema.metadata.said === newSaid) {
          throw new Error(`Schema with SAID ${newSaid} already exists with ID ${existingId}`);
        }
      }
    }

    const updated = {
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        id, // Preserve original ID
        said: newSaid,
        updatedAt: now
      },
      jsonSchema: updates.jsonSchema ? { $id: newSaid, ...updates.jsonSchema } : existing.jsonSchema,
      fields: updates.fields !== undefined ? updates.fields : existing.fields
    };

    this.schemas.set(id, updated);
    this.metadata.lastModified = now;

    console.log(`📝 Updated schema in memory: ${updated.metadata.name} (${updated.metadata.said})`);
    return updated;
  }

  async delete(id) {
    const deleted = this.schemas.delete(id);
    if (deleted) {
      this.metadata.totalSchemas = this.schemas.size;
      this.metadata.lastModified = new Date().toISOString();
      console.log(`🗑️  Deleted schema from memory: ${id}`);
    }
    return deleted;
  }

  async list(query = {}) {
    let schemas = Array.from(this.schemas.values());

    // Apply search filter
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      schemas = schemas.filter(schema => 
        schema.metadata.name.toLowerCase().includes(searchLower) ||
        schema.metadata.description.toLowerCase().includes(searchLower) ||
        schema.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    const sortBy = query.sortBy || 'updatedAt';
    const sortOrder = query.sortOrder || 'desc';
    
    schemas.sort((a, b) => {
      let aVal = a.metadata[sortBy];
      let bVal = b.metadata[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const limit = query.limit || 100;
    const offset = query.offset || 0;
    const total = schemas.length;
    const paginatedSchemas = schemas.slice(offset, offset + limit);

    return {
      schemas: paginatedSchemas,
      total,
      hasMore: offset + limit < total,
      offset,
      limit
    };
  }

  async exists(said) {
    for (const schema of this.schemas.values()) {
      if (schema.metadata.said === said) {
        return true;
      }
    }
    return false;
  }

  async bulkCreate(requests) {
    const results = [];
    for (const request of requests) {
      results.push(await this.create(request));
    }
    return results;
  }

  async bulkDelete(ids) {
    const results = [];
    for (const id of ids) {
      results.push(await this.delete(id));
    }
    return results;
  }

  async getSchemaForOOBI(said) {
    const schema = await this.readBySaid(said);
    return schema?.jsonSchema || null;
  }

  async isAvailable() {
    return true; // In-memory is always available
  }

  getProviderInfo() {
    return {
      name: 'In-Memory Schema Provider',
      type: 'memory',
      version: '1.0.0',
      capabilities: ['create', 'read', 'update', 'delete', 'list', 'bulk'],
      schemaCount: this.schemas.size,
      metadata: this.metadata
    };
  }

  computeSAID(jsonSchema) {
    try {
      const schemaForSaid = { $id: '', ...jsonSchema };
      const [saider] = Saider.saidify(schemaForSaid, undefined, undefined, '$id');
      return saider.qb64;
    } catch (error) {
      console.error('Failed to compute SAID:', error);
      throw error;
    }
  }
}

// Schema Service
export class SchemaService {
  constructor(config) {
    this.config = config;
    this.provider = this.createProvider(config.provider);
  }

  createProvider(type) {
    switch (type) {
      case 'localStorage':
        return new LocalStorageSchemaProvider();
      case 'memory':
        return new InMemorySchemaProvider();
      case 'remoteApi':
        throw new Error('Remote API provider not implemented in consolidated version');
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  async createSchema(request) {
    return this.provider.create(request);
  }

  async getSchema(id) {
    return this.provider.read(id);
  }

  async getSchemaBySaid(said) {
    return this.provider.readBySaid(said);
  }

  async updateSchema(id, request) {
    return this.provider.update(id, request);
  }

  async deleteSchema(id) {
    return this.provider.delete(id);
  }

  async listSchemas(query) {
    return this.provider.list(query);
  }

  async schemaExists(said) {
    return this.provider.exists(said);
  }

  async getSchemaForOOBI(said) {
    return this.provider.getSchemaForOOBI(said);
  }

  async isAvailable() {
    return this.provider.isAvailable();
  }

  getProviderInfo() {
    return this.provider.getProviderInfo();
  }
}

// Global service instance
let globalSchemaService = null;

export function initializeSchemaService(config) {
  globalSchemaService = new SchemaService(config);
  return globalSchemaService;
}

export function initializeDefaultSchemaService() {
  return initializeSchemaService({ provider: 'localStorage' });
}

export function getSchemaService() {
  if (!globalSchemaService) {
    throw new Error('Schema service not initialized. Call initializeSchemaService() first.');
  }
  return globalSchemaService;
}

// Export empty objects for types to prevent import errors
// These will be used by TypeScript but ignored at runtime
export const SchemaMetadata = {};
export const SchemaData = {};
export const CredentialField = {};
export const SchemaQuery = {};
export const SchemaSearchResult = {};
export const CreateSchemaRequest = {};
export const UpdateSchemaRequest = {};
export const SchemaStorageProvider = {};
export const SchemaProviderType = {};
export const SchemaServiceConfig = {};