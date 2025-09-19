// Type declarations for schemaStorage.js

export interface SchemaMetadata {
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

export interface CredentialField {
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

export interface SchemaData {
  metadata: SchemaMetadata;
  jsonSchema: any;
  fields?: CredentialField[];
}

export interface SchemaQuery {
  search?: string;
  tags?: string[];
  createdBy?: string;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SchemaSearchResult {
  schemas: SchemaData[];
  total: number;
  hasMore: boolean;
}

export interface CreateSchemaRequest {
  name: string;
  description?: string;
  jsonSchema: any;
  fields?: CredentialField[];
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateSchemaRequest {
  name?: string;
  description?: string;
  jsonSchema?: any;
  fields?: CredentialField[];
  tags?: string[];
  isPublic?: boolean;
}

export interface SchemaStorageProvider {
  create(request: CreateSchemaRequest): Promise<SchemaData>;
  read(id: string): Promise<SchemaData | null>;
  readBySaid(said: string): Promise<SchemaData | null>;
  update(id: string, request: UpdateSchemaRequest): Promise<SchemaData>;
  delete(id: string): Promise<boolean>;
  list(query?: SchemaQuery): Promise<SchemaSearchResult>;
  exists(said: string): Promise<boolean>;
  bulkCreate(requests: CreateSchemaRequest[]): Promise<SchemaData[]>;
  bulkDelete(ids: string[]): Promise<boolean[]>;
  getSchemaForOOBI(said: string): Promise<any | null>;
  isAvailable(): Promise<boolean>;
  getProviderInfo(): {
    name: string;
    type: 'local' | 'remote';
    version: string;
    capabilities: string[];
  };
}

export type SchemaProviderType = 'localStorage' | 'remoteApi';

export interface SchemaServiceConfig {
  provider: SchemaProviderType;
  fallbackToLocalStorage?: boolean;
}

export class LocalStorageSchemaProvider implements SchemaStorageProvider {
  create(request: CreateSchemaRequest): Promise<SchemaData>;
  read(id: string): Promise<SchemaData | null>;
  readBySaid(said: string): Promise<SchemaData | null>;
  update(id: string, request: UpdateSchemaRequest): Promise<SchemaData>;
  delete(id: string): Promise<boolean>;
  list(query?: SchemaQuery): Promise<SchemaSearchResult>;
  exists(said: string): Promise<boolean>;
  bulkCreate(requests: CreateSchemaRequest[]): Promise<SchemaData[]>;
  bulkDelete(ids: string[]): Promise<boolean[]>;
  getSchemaForOOBI(said: string): Promise<any | null>;
  isAvailable(): Promise<boolean>;
  getProviderInfo(): {
    name: string;
    type: 'local' | 'remote';
    version: string;
    capabilities: string[];
  };
}

export class SchemaService {
  constructor(config: SchemaServiceConfig);
  createSchema(request: CreateSchemaRequest): Promise<SchemaData>;
  getSchema(id: string): Promise<SchemaData | null>;
  getSchemaBySaid(said: string): Promise<SchemaData | null>;
  updateSchema(id: string, request: UpdateSchemaRequest): Promise<SchemaData>;
  deleteSchema(id: string): Promise<boolean>;
  listSchemas(query?: SchemaQuery): Promise<SchemaSearchResult>;
  schemaExists(said: string): Promise<boolean>;
  getSchemaForOOBI(said: string): Promise<any | null>;
  isAvailable(): Promise<boolean>;
  getProviderInfo(): any;
}

export function initializeSchemaService(config: SchemaServiceConfig): SchemaService;
export function initializeDefaultSchemaService(): SchemaService;
export function getSchemaService(): SchemaService;