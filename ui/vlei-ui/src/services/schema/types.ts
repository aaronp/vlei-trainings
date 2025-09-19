// Schema storage types and interfaces

export type SchemaMetadata = {
  id: string;
  said: string;
  name: string;
  description?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags?: string[];
  isPublic?: boolean;
}

export type SchemaData = {
  metadata: SchemaMetadata;
  jsonSchema: any; // The actual JSON schema content
  fields?: CredentialField[]; // UI field definitions for form generation
}

export type CredentialField = {
  name: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'date' | 'number' | 'boolean';
  required: boolean;
  maxLength?: number;
  minLength?: number;
  options?: string[];
  placeholder?: string;
  description?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export type SchemaQuery = {
  search?: string;
  tags?: string[];
  createdBy?: string;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export type SchemaSearchResult = {
  schemas: SchemaData[];
  total: number;
  hasMore: boolean;
}

export type CreateSchemaRequest = {
  name: string;
  description?: string;
  jsonSchema: any;
  fields?: CredentialField[];
  tags?: string[];
  isPublic?: boolean;
}

export type UpdateSchemaRequest = {
  name?: string;
  description?: string;
  jsonSchema?: any;
  fields?: CredentialField[];
  tags?: string[];
  isPublic?: boolean;
}

// Storage provider interface
export interface SchemaStorageProvider {
  // CRUD operations
  create(request: CreateSchemaRequest): Promise<SchemaData>;
  read(id: string): Promise<SchemaData | null>;
  readBySaid(said: string): Promise<SchemaData | null>;
  update(id: string, request: UpdateSchemaRequest): Promise<SchemaData>;
  delete(id: string): Promise<boolean>;
  
  // Query operations
  list(query?: SchemaQuery): Promise<SchemaSearchResult>;
  exists(said: string): Promise<boolean>;
  
  // Bulk operations
  bulkCreate(requests: CreateSchemaRequest[]): Promise<SchemaData[]>;
  bulkDelete(ids: string[]): Promise<boolean[]>;
  
  // Schema serving (for OOBI resolution)
  getSchemaForOOBI(said: string): Promise<any | null>;
  
  // Health check
  isAvailable(): Promise<boolean>;
  
  // Provider info
  getProviderInfo(): {
    name: string;
    type: 'local' | 'remote';
    version: string;
    capabilities: string[];
  };
}